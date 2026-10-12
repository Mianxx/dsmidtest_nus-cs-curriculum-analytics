"""
src/loader.py — NUS CS/AI Curriculum Analytics
Khối 1: Thu thập và lưu trữ bộ nhớ tạm dữ liệu thô NUSMods API v2 (5 niên khóa)
Khối 2: Tiền xử lý, bóc tách cây logic AST, bù khuyết trung vị phân tầng, kỹ thuật đặc trưng
Khối 3: Khử trùng lặp và xuất bản các tập dữ liệu sạch chuẩn 1NF (1.400 môn & 348 môn duy nhất)
"""

import concurrent.futures
import json
import re
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import requests

# Cấu hình UTF-8 cho stdout/stderr trên Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Cấu hình hệ thống thu thập
# ---------------------------------------------------------------------------

ACADEMIC_YEARS = ["2022-2023", "2023-2024", "2024-2025", "2025-2026", "2026-2027"]
TARGET_PREFIXES = ("CS", "IS", "DSA")
_PREFIX_RE = re.compile(r'^(?:' + '|'.join(TARGET_PREFIXES) + r')\d')
CACHE_PATH = Path("data/raw_nus_cs.json")
BASE_URL = "https://api.nusmods.com/v2/{year}"
MAX_WORKERS = 10

AI_KEYWORDS = [
    "learning", "intelligence", "neural", "vision", "nlp",
    "deep", "reinforcement", "robot", "perception"
]

# ---------------------------------------------------------------------------
# Khối 1 — Thu thập dữ liệu API & Bộ nhớ tạm
# ---------------------------------------------------------------------------

def _get_json(url: str, session: requests.Session | None = None) -> dict | list | None:
    client = session or requests
    for _ in range(3):
        try:
            r = client.get(url, timeout=12)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
    return None


def _fetch_module_worker(args: tuple[str, str]) -> dict | None:
    year, code = args
    data = _get_json(f"{BASE_URL.format(year=year)}/modules/{code}.json")
    if data:
        data["_year"] = year
    return data


def _fetch_year(year: str) -> list[dict]:
    print(f"[*] Đang tải danh sách học phần cho niên khóa {year}...")
    mod_list = _get_json(f"{BASE_URL.format(year=year)}/moduleList.json") or []
    targets = [m["moduleCode"] for m in mod_list if _PREFIX_RE.match(m.get("moduleCode", ""))]
    print(f"    Tìm thấy {len(targets)} học phần phù hợp (CS/IS/DSA). Đang tải chi tiết...")

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for item in executor.map(_fetch_module_worker, [(year, code) for code in targets]):
            if item:
                results.append(item)

    print(f"    Hoàn tất {year}: {len(results)}/{len(targets)} học phần đã tải.")
    return results


def load_or_fetch(cache: Path = CACHE_PATH, years: list[str] = ACADEMIC_YEARS) -> dict[str, list[dict]]:
    """Tải dữ liệu thô từ bộ nhớ tạm local, hoặc thu thập mới từ NUSMods API nếu chưa có."""
    if cache.exists():
        print(f"[Bộ nhớ tạm] Nạp dữ liệu thô có sẵn từ {cache}")
        return json.loads(cache.read_text(encoding="utf-8"))

    cache.parent.mkdir(parents=True, exist_ok=True)
    data: dict[str, list[dict]] = {}
    for year in years:
        data[year] = _fetch_year(year)
        cache.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[Thành công] Đã lưu trữ toàn bộ dữ liệu thô vào {cache}")
    return data

# ---------------------------------------------------------------------------
# Khối 2 — Làm sạch dữ liệu, Phân rã AST & Kỹ thuật đặc trưng
# ---------------------------------------------------------------------------

def _normalize_code(code: str) -> str:
    """Chuẩn hóa mã môn học, loại bỏ yêu cầu điểm và biến thể (ví dụ: CS2040C:D -> CS2040)."""
    code = code.split(":")[0].strip()
    m = re.match(r"^([A-Z]{2,4}\d{4})", code)
    return m.group(1) if m else code


def extract_prereq_codes(module: dict) -> list[str]:
    """
    Trích xuất toàn bộ mã môn học tiên quyết trực tiếp của học phần.
    Ưu tiên duyệt đệ quy cây AST prereqTree; dự phòng bóc tách chuỗi văn bản prerequisite.
    """
    tree = module.get("prereqTree")
    codes = set()

    def _walk(node):
        if isinstance(node, str):
            codes.add(_normalize_code(node))
        elif isinstance(node, dict):
            for k, v in node.items():
                if k == "nOf" and isinstance(v, list) and len(v) == 2:
                    _walk(v[1])
                elif isinstance(v, list):
                    for item in v:
                        _walk(item)
                elif isinstance(v, (dict, str)):
                    _walk(v)
        elif isinstance(node, list):
            for item in node:
                _walk(item)

    if tree:
        _walk(tree)
    elif module.get("prerequisite"):
        matches = re.findall(r"\b([A-Z]{2,4}\d{4})[A-Z]*\b", str(module["prerequisite"]))
        for c in matches:
            codes.add(_normalize_code(c))

    # Loại bỏ tự phụ thuộc nếu có
    base_self = _normalize_code(module.get("moduleCode", ""))
    codes.discard(base_self)
    return sorted(codes)


def build_dataframe(raw_data: dict[str, list[dict]]) -> pd.DataFrame:
    """
    Chuyển đổi dữ liệu JSON thô thành DataFrame phẳng sạch chuẩn 26 cột (chuẩn 1NF).
    Thực hiện phân rã khối lượng giờ học, bù khuyết trung vị theo cấp bậc đào tạo,
    trích xuất cây logic tiên quyết AST, và chuẩn hóa Min-Max [0, 1].
    Loại bỏ triệt để chuỗi JSON lồng nhau semesterData khỏi bảng phẳng.
    """
    rows = []
    for year, modules in raw_data.items():
        for m in modules:
            code = m.get("moduleCode", "")
            m_dig = re.search(r"\d", code)
            level = int(m_dig.group()) if m_dig else 1

            # Phân bổ khối lượng học tập 5 thành phần
            w = m.get("workload")
            is_valid_w = isinstance(w, list) and len(w) == 5 and all(isinstance(x, (int, float)) for x in w)
            lec = float(w[0]) if is_valid_w else np.nan
            tut = float(w[1]) if is_valid_w else np.nan
            lab = float(w[2]) if is_valid_w else np.nan
            proj = float(w[3]) if is_valid_w else np.nan
            prep = float(w[4]) if is_valid_w else np.nan

            # Số tín chỉ moduleCredit
            try:
                credit = float(m.get("moduleCredit", 4.0))
            except (ValueError, TypeError):
                credit = 4.0

            # Điều kiện tiên quyết
            prereqs = extract_prereq_codes(m)

            # Nhận diện trọng tâm AI/ML
            text_desc = f"{m.get('title', '')} {m.get('description', '')}".lower()
            is_ai = any(kw in text_desc for kw in AI_KEYWORDS)

            # Bậc đào tạo
            study_tier = "Đại học" if level <= 4 else "Sau đại học"

            # Phân ngành đào tạo (CS, IS, DSA)
            dept = "CS"
            if code.startswith("IS"):
                dept = "IS"
            elif code.startswith("DSA"):
                dept = "DSA"

            rows.append({
                "moduleCode": code,
                "title": m.get("title", ""),
                "academicYear": year,
                "level": level,
                "study_tier": study_tier,
                "dept": dept,
                "moduleCredit": credit,
                "lec_hours": lec,
                "tut_hours": tut,
                "lab_hours": lab,
                "proj_hours": proj,
                "prep_hours": prep,
                "is_workload_imputed": not is_valid_w,
                "prereq_codes": prereqs,
                "prereq_count": len(prereqs),
                "is_ai_core": is_ai,
                "description": m.get("description", ""),
                "total_workload": 0.0,  # Sẽ tính sau khi điền khuyết
                "self_study_ratio": 0.0,
            })

    df = pd.DataFrame(rows)

    # Bù khuyết trung vị phân tầng theo cấp độ (Level 1..6)
    workload_cols = ["lec_hours", "tut_hours", "lab_hours", "proj_hours", "prep_hours"]
    global_medians = df[workload_cols].median().to_dict()

    for col in workload_cols:
        lvl_median = df.groupby("level")[col].transform("median")
        df[col] = df[col].fillna(lvl_median).fillna(global_medians[col])

    # Tính toán đặc trưng tổng tải và tỷ lệ tự học
    df["total_workload"] = df[workload_cols].sum(axis=1)
    df["self_study_ratio"] = np.where(
        df["total_workload"] > 0,
        df["prep_hours"] / df["total_workload"],
        0.0
    )

    # Chuẩn hóa Min-Max [0, 1] trên các biến liên tục
    norm_cols = workload_cols + ["total_workload", "moduleCredit"]
    for col in norm_cols:
        c_min = df[col].min()
        c_max = df[col].max()
        df[f"{col}_norm"] = (df[col] - c_min) / (c_max - c_min) if c_max > c_min else 0.0

    return df


# ---------------------------------------------------------------------------
# Khối 3 — Khử trùng lặp, Trích xuất phòng học & Xuất bản tệp dữ liệu sạch
# ---------------------------------------------------------------------------

def deduplicate_latest_modules(df: pd.DataFrame) -> pd.DataFrame:
    """
    Lọc các học phần duy nhất (348 môn) theo phiên bản niên khóa cập nhật mới nhất.
    Sắp xếp thứ tự theo mã môn học nhằm phục vụ phân tích mạng DAG và mô hình học máy.
    """
    df_unique = df.sort_values("academicYear").drop_duplicates(subset=["moduleCode"], keep="last").copy()
    return df_unique.sort_values("moduleCode").reset_index(drop=True)


def extract_venues_ranking(raw_data: dict[str, list[dict]]) -> list[dict]:
    """
    Bóc tách bảng xếp hạng tần suất các giảng đường và phòng học tổ chức môn học.
    Được trích xuất riêng biệt từ semesterData của tệp thô, không đưa dữ liệu lồng nhau vào bảng CSV.
    """
    venue_counter: dict[str, int] = {}
    for yr, mods in raw_data.items():
        for m in mods:
            for s in m.get("semesterData", []):
                for t in s.get("timetable", []):
                    v = t.get("venue")
                    if v and isinstance(v, str) and v.upper() not in ["ONLINE", "E-LEARN"]:
                        b_match = re.match(r"^([A-Z]+[0-9]*[A-Z]*)", v)
                        bldg = b_match.group(1) if b_match else v
                        venue_counter[bldg] = venue_counter.get(bldg, 0) + 1

    top_venues = sorted(venue_counter.items(), key=lambda x: x[1], reverse=True)[:15]
    return [
        {
            "venue": bldg,
            "slots": count,
            "category": "Computing" if bldg in ["COM1", "COM2", "COM3", "COM4"] else ("Lecture Theatre" if bldg.startswith("LT") else "Khối Liên ngành"),
        }
        for bldg, count in top_venues
    ]


def clean_and_export_all(
    raw_data: dict[str, list[dict]] | None = None,
    data_dir: Path | str = "data"
) -> tuple[pd.DataFrame, pd.DataFrame, list[dict]]:
    """
    Quy trình điều phối làm sạch toàn diện và xuất bản các tập dữ liệu sạch:
    1. cleaned_nus_cs.csv: 1.400 lượt môn học phẳng 26 cột (~420 KB)
    2. unique_nus_cs.csv: 348 môn học duy nhất mới nhất (~110 KB)
    3. venues_ranking.json: Bảng xếp hạng phòng học sạch
    """
    out_dir = Path(data_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if raw_data is None:
        raw_data = load_or_fetch(out_dir / "raw_nus_cs.json")

    df_all = build_dataframe(raw_data)
    df_unique = deduplicate_latest_modules(df_all)
    venues = extract_venues_ranking(raw_data)

    csv_all = out_dir / "cleaned_nus_cs.csv"
    csv_unique = out_dir / "unique_nus_cs.csv"
    json_venues = out_dir / "venues_ranking.json"

    df_all.to_csv(csv_all, index=False, encoding="utf-8")
    df_unique.to_csv(csv_unique, index=False, encoding="utf-8")
    json_venues.write_text(json.dumps(venues, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[XONG] Đã xuất {len(df_all):,} bản ghi sạch phẳng ra {csv_all} ({csv_all.stat().st_size:,} bytes)")
    print(f"[XONG] Đã xuất {len(df_unique):,} môn học duy nhất ra {csv_unique} ({csv_unique.stat().st_size:,} bytes)")
    print(f"[XONG] Đã xuất danh sách {len(venues)} giảng đường hàng đầu ra {json_venues}")

    return df_all, df_unique, venues


if __name__ == "__main__":
    raw = load_or_fetch()
    df_all, df_unique, venues = clean_and_export_all(raw)
    print(f"[Kiểm tra] Bảng 1.400 môn: {df_all.shape}, Bảng 348 môn duy nhất: {df_unique.shape}")
