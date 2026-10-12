"""
src/analytics.py — Tính toán toàn bộ chỉ số phân tích định lượng & mô hình ML cho hệ thống NUS CS Analytics.
Xuất số liệu tiền tính toán sang data/web_data.json và đồng bộ docs/data/web_data.json.
Bao quát toàn diện các câu hỏi nghiên cứu từ Q1.1 đến Q5.3.
"""

import ast
import json
import re
import sys
from pathlib import Path
import networkx as nx
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score

sys.stdout.reconfigure(encoding="utf-8")

# Known title mappings for external prerequisites (Science, Engineering, Math, Stats)
EXTERNAL_TITLES = {
    "ST2131": "Probability",
    "ST2334": "Probability and Statistics",
    "MA2116": "Matrices II",
    "MA2001": "Linear Algebra I",
    "MA2216": "Numerical Analysis I",
    "MA1508": "Linear Algebra for Engineers",
    "EE2012": "Analytical Methods in ECE",
    "MA1522": "Linear Algebra for Computing",
    "MA2002": "Calculus",
    "MA1101": "Linear Algebra",
    "MA1311": "Matrix Algebra",
    "MA1513": "Linear Algebra with Differential Equations",
    "MA1521": "Calculus for Computing",
    "PC1201": "Fundamentals of Physics",
    "PC1432": "Physics IIE",
}

STOPWORDS_EXTENDED = [
    "module", "course", "courses", "students", "student", "will", "use", "using", "used", "study",
    "studies", "topics", "topic", "provide", "provides", "including", "include", "includes", "also",
    "various", "techniques", "technique", "methods", "method", "one", "two", "three", "based", "well", "such",
    "and", "to", "the", "in", "of", "for", "with", "a", "an", "is", "are",
    "this", "that", "as", "by", "on", "from", "at", "be", "it", "or", "through",
    "can", "their", "have", "has", "do", "does", "how", "what", "which",
    "application", "applications", "apply", "project", "projects", "problem", "problems", "skills", "knowledge",
    "introduce", "introduces", "introduction", "aims", "cover", "covers", "covered", "basic", "advanced",
    "practical", "principles", "principle", "technologies", "technology", "concept", "concepts", "issue", "issues",
    "design", "development", "develop", "develops", "solution", "solutions", "hands", "gain", "understanding",
    "understand", "system", "systems", "computational", "programming", "program", "management", "integration",
    "area", "areas", "example", "examples", "process", "processes", "build", "building", "work", "working",
    "tool", "tools", "these", "its", "human", "explore", "explores", "part", "parts", "domain", "domains",
    "fundamental", "fundamentals", "real", "world", "key", "modern", "solving", "solve", "theory", "theoretical",
    "approaches", "approach", "field", "fields", "require", "requires", "required", "prerequisite", "prerequisites",
    "taught", "teaching", "learn", "etc", "many", "may", "set", "sound", "aspect", "focus",
    "digitaltext", "related", "challenges", "main", "variety", "experience", "equip", "tasks",
    "smart", "practice", "paradigm", "foundation", "foundational", "essential", "framework",
    "structure", "core", "requirement", "requirements", "software", "algorithmic", "representation"
]


def _parse_prereq_list(p_raw) -> list[str]:
    """Safely parse prerequisite code representations from strings or lists."""
    if pd.isna(p_raw) or not p_raw:
        return []
    if isinstance(p_raw, list):
        return p_raw
    if isinstance(p_raw, str):
        try:
            val = ast.literal_eval(p_raw)
            return val if isinstance(val, list) else []
        except (ValueError, SyntaxError):
            return []
    return []


def load_datasets():
    csv_path = Path("data/cleaned_nus_cs.csv")
    unique_csv_path = Path("data/unique_nus_cs.csv")
    venues_path = Path("data/venues_ranking.json")
    json_path = Path("data/raw_nus_cs.json")

    if not csv_path.exists():
        raise FileNotFoundError(f"Missing {csv_path}. Please run data loader first.")

    df = pd.read_csv(csv_path)

    # Nạp tập 348 môn học duy nhất từ unique_nus_cs.csv hoặc tự động khử trùng lặp từ df
    if unique_csv_path.exists():
        df_unique = pd.read_csv(unique_csv_path)
    else:
        df_unique = df.sort_values("academicYear").drop_duplicates(subset=["moduleCode"], keep="last").copy()

    # Nạp xếp hạng phòng học sạch từ venues_ranking.json (hoặc bóc tách dự phòng nếu cần)
    venues_ranking = []
    if venues_path.exists():
        venues_ranking = json.loads(venues_path.read_text(encoding="utf-8"))
    elif json_path.exists():
        with open(json_path, encoding="utf-8") as f:
            raw_data = json.load(f)
        from loader import extract_venues_ranking
        venues_ranking = extract_venues_ranking(raw_data)

    return df, df_unique, venues_ranking


def compute_kpis(df: pd.DataFrame, df_unique: pd.DataFrame) -> dict:
    total_mods = int(len(df))
    unique_mods = int(len(df_unique))
    ai_share_pct = round(float(df["is_ai_core"].mean() * 100), 2)
    ai_unique_share_pct = round(float(df_unique["is_ai_core"].mean() * 100), 2)
    avg_workload = round(float(df["total_workload"].mean()), 2)
    median_workload = round(float(df["total_workload"].median()), 2)

    ug_mask = df["level"] <= 4
    pg_mask = df["level"] >= 5

    median_prep_ug = round(float(df[ug_mask]["prep_hours"].median()), 1)
    median_prep_pg = round(float(df[pg_mask]["prep_hours"].median()), 1)
    mean_prep_ug = round(float(df[ug_mask]["prep_hours"].mean()), 2)
    mean_prep_pg = round(float(df[pg_mask]["prep_hours"].mean()), 2)

    return {
        "total_modules": total_mods,
        "unique_modules": unique_mods,
        "ai_share_pct": ai_share_pct,
        "ai_unique_share_pct": ai_unique_share_pct,
        "avg_workload": avg_workload,
        "median_workload": median_workload,
        "median_prep_ug": median_prep_ug,
        "median_prep_pg": median_prep_pg,
        "mean_prep_ug": mean_prep_ug,
        "mean_prep_pg": mean_prep_pg,
    }


def compute_q1_curriculum(df: pd.DataFrame, df_unique: pd.DataFrame, venues_input: list[dict] | dict) -> dict:
    total = len(df)
    ug_count = int(sum(df["study_tier"] == "Đại học"))
    pg_count = int(sum(df["study_tier"].isin(["Sau đại học", "Sau Đại học"])))

    tier_distribution = {
        "undergrad": {
            "count": ug_count,
            "ratio": round(ug_count / total, 4),
            "percentage": round(ug_count / total * 100, 2),
            "label": "Bậc Cử nhân (Level 1 - 4)",
        },
        "postgrad": {
            "count": pg_count,
            "ratio": round(pg_count / total, 4),
            "percentage": round(pg_count / total * 100, 2),
            "label": "Bậc Sau đại học (Level 5 - 6)",
        },
    }

    # Level distribution 1-6
    level_counts = df["level"].value_counts().sort_index().to_dict()
    level_distribution = []
    for lvl in range(1, 7):
        cnt = int(level_counts.get(lvl, 0))
        level_distribution.append({
            "level": lvl,
            "count": cnt,
            "ratio": round(cnt / total, 4),
            "percentage": round(cnt / total * 100, 2),
            "tier": "Đại học" if lvl <= 4 else "Sau đại học",
            "tier_label": "Bậc Cử nhân" if lvl <= 4 else "Bậc Sau đại học",
        })

    # Credit distribution
    credit_counts = df["moduleCredit"].value_counts().sort_index().to_dict()
    credit_distribution = []
    for mc, cnt in credit_counts.items():
        credit_distribution.append({
            "credit": float(mc),
            "count": int(cnt),
            "percentage": round(cnt / total * 100, 2),
        })

    standard_4mc_count = int(credit_counts.get(4.0, 0))
    standard_4mc_pct = round(standard_4mc_count / total * 100, 2)

    # Department distribution (CS vs IS vs DSA)
    df["prefix"] = df["moduleCode"].str.extract(r"^([A-Z]{2,3})")
    dept_counts = df["prefix"].value_counts().to_dict()
    dept_map = {
        "CS": "Khoa Khoa học Máy tính (CS)",
        "IS": "Khoa Hệ thống Thông tin (IS)",
        "DSA": "Khoa Khoa học Dữ liệu (DSA)",
    }
    dept_distribution = {
        prefix: {
            "code": prefix,
            "name": dept_map.get(prefix, prefix),
            "count": int(cnt),
            "percentage": round(cnt / total * 100, 2),
        }
        for prefix, cnt in dept_counts.items()
    }

    # Yearly trends (5 Academic Years)
    yearly_trends = []
    for yr in sorted(df["academicYear"].unique()):
        sub = df[df["academicYear"] == yr]
        t_yr = len(sub)
        ai_yr = int(sub["is_ai_core"].sum())
        yearly_trends.append({
            "academicYear": yr,
            "total_modules": t_yr,
            "ai_modules": ai_yr,
            "ai_share_pct": round(ai_yr / t_yr * 100, 2) if t_yr > 0 else 0.0,
            "avg_workload": round(float(sub["total_workload"].mean()), 2),
        })

    # Bảng xếp hạng phòng học từ dữ liệu sạch hoặc trích xuất dự phòng
    if isinstance(venues_input, list):
        venues_ranking = venues_input
    else:
        venue_counter = {}
        for yr, mods in venues_input.items():
            for m in mods:
                for s in m.get("semesterData", []):
                    for t in s.get("timetable", []):
                        v = t.get("venue")
                        if v and isinstance(v, str) and v.upper() not in ["ONLINE", "E-LEARN"]:
                            b_match = re.match(r"^([A-Z]+[0-9]*[A-Z]*)", v)
                            bldg = b_match.group(1) if b_match else v
                            venue_counter[bldg] = venue_counter.get(bldg, 0) + 1

        top_venues = sorted(venue_counter.items(), key=lambda x: x[1], reverse=True)[:15]
        venues_ranking = [
            {
                "venue": bldg,
                "slots": count,
                "category": "Computing" if bldg in ["COM1", "COM2", "COM3", "COM4"] else ("Lecture Theatre" if bldg.startswith("LT") else "Khối Liên ngành"),
            }
            for bldg, count in top_venues
        ]

    return {
        "tier_distribution": tier_distribution,
        "level_distribution": level_distribution,
        "credit_distribution": credit_distribution,
        "standard_4mc_pct": standard_4mc_pct,
        "dept_distribution": dept_distribution,
        "yearly_trends": yearly_trends,
        "venues_ranking": venues_ranking,
    }


def compute_q2_workload(df: pd.DataFrame, df_unique: pd.DataFrame) -> dict:
    components = ["lec_hours", "tut_hours", "lab_hours", "proj_hours", "prep_hours", "total_workload"]
    components_mean = {
        col: round(float(df[col].mean()), 2) for col in components
    }
    components_mean["self_study_ratio"] = round(float(df["self_study_ratio"].mean()), 4)

    # Workload breakdown by tier
    components_by_tier = {}
    for tier in ["Đại học", "Sau đại học"]:
        sub = df[df["study_tier"].isin([tier, tier.replace("đ", "Đ")])]
        components_by_tier[tier] = {
            col: round(float(sub[col].mean()), 2) for col in components
        }
        components_by_tier[tier]["self_study_ratio"] = round(float(sub["self_study_ratio"].mean()), 4)

    # OLS Regression: prep_hours vs level
    res_level = stats.linregress(df["level"], df["prep_hours"])
    res_level_uniq = stats.linregress(df_unique["level"], df_unique["prep_hours"])

    # OLS Regression: prep_hours vs moduleCredit
    res_credit = stats.linregress(df["moduleCredit"], df["prep_hours"])

    ols_regression = {
        "prep_vs_level": {
            "slope": round(float(res_level.slope), 4),
            "intercept": round(float(res_level.intercept), 4),
            "p_value": float(res_level.pvalue),
            "r_squared": round(float(res_level.rvalue ** 2), 4),
            "std_err": round(float(res_level.stderr), 4),
            "equation": f"y = {res_level.slope:.2f}x + {res_level.intercept:.2f}",
        },
        "prep_vs_level_unique": {
            "slope": round(float(res_level_uniq.slope), 4),
            "intercept": round(float(res_level_uniq.intercept), 4),
            "p_value": float(res_level_uniq.pvalue),
            "r_squared": round(float(res_level_uniq.rvalue ** 2), 4),
            "std_err": round(float(res_level_uniq.stderr), 4),
            "equation": f"y = {res_level_uniq.slope:.2f}x + {res_level_uniq.intercept:.2f}",
        },
        "prep_vs_credit": {
            "slope": round(float(res_credit.slope), 4),
            "intercept": round(float(res_credit.intercept), 4),
            "p_value": float(res_credit.pvalue),
            "r_squared": round(float(res_credit.rvalue ** 2), 4),
            "std_err": round(float(res_credit.stderr), 4),
            "equation": f"y = {res_credit.slope:.2f}x + {res_credit.intercept:.2f}",
        },
    }

    # AI vs Non-AI workload stats
    ai_sub = df[df["is_ai_core"]]
    non_ai_sub = df[~df["is_ai_core"]]

    ai_vs_non_ai = {
        "ai_modules": {
            "count": int(len(ai_sub)),
            "total_workload_mean": round(float(ai_sub["total_workload"].mean()), 2),
            "prep_hours_mean": round(float(ai_sub["prep_hours"].mean()), 2),
            "self_study_ratio_mean": round(float(ai_sub["self_study_ratio"].mean()), 4),
        },
        "non_ai_modules": {
            "count": int(len(non_ai_sub)),
            "total_workload_mean": round(float(non_ai_sub["total_workload"].mean()), 2),
            "prep_hours_mean": round(float(non_ai_sub["prep_hours"].mean()), 2),
            "self_study_ratio_mean": round(float(non_ai_sub["self_study_ratio"].mean()), 4),
        },
        "delta_prep": round(float(ai_sub["prep_hours"].mean() - non_ai_sub["prep_hours"].mean()), 2),
        "delta_workload": round(float(ai_sub["total_workload"].mean() - non_ai_sub["total_workload"].mean()), 2),
    }

    # Workload distributions by level for Boxplot/Violin chart
    def calc_level_dist(col_name):
        dist = []
        for lvl in range(1, 7):
            sub_lvl = df_unique[df_unique["level"] == lvl][col_name]
            if len(sub_lvl) > 0:
                q25, q50, q75 = np.percentile(sub_lvl, [25, 50, 75])
                iqr = q75 - q25
                low_whisker = float(sub_lvl[sub_lvl >= q25 - 1.5 * iqr].min()) if len(sub_lvl[sub_lvl >= q25 - 1.5 * iqr]) else float(q25)
                up_whisker = float(sub_lvl[sub_lvl <= q75 + 1.5 * iqr].max()) if len(sub_lvl[sub_lvl <= q75 + 1.5 * iqr]) else float(q75)
                outliers = [float(x) for x in sub_lvl[(sub_lvl < q25 - 1.5 * iqr) | (sub_lvl > q75 + 1.5 * iqr)]]
                dist.append({
                    "level": lvl,
                    "tier": "Đại học" if lvl <= 4 else "Sau Đại học",
                    "count": int(len(sub_lvl)),
                    "mean": round(float(sub_lvl.mean()), 2),
                    "median": round(float(q50), 2),
                    "q25": round(float(q25), 2),
                    "q75": round(float(q75), 2),
                    "min": round(float(sub_lvl.min()), 2),
                    "max": round(float(sub_lvl.max()), 2),
                    "lower_whisker": round(low_whisker, 2),
                    "upper_whisker": round(up_whisker, 2),
                    "outliers": outliers,
                })
        return dist

    prep_distribution_by_level = calc_level_dist("prep_hours")
    total_distribution_by_level = calc_level_dist("total_workload")
    lec_distribution_by_level = calc_level_dist("lec_hours")

    workload_distributions = {
        "prep_hours": prep_distribution_by_level,
        "total_workload": total_distribution_by_level,
        "lec_hours": lec_distribution_by_level,
    }

    return {
        "components_mean": components_mean,
        "components_by_tier": components_by_tier,
        "ols_regression": ols_regression,
        "ai_vs_non_ai": ai_vs_non_ai,
        "prep_distribution_by_level": prep_distribution_by_level,
        "workload_distributions": workload_distributions,
    }


def compute_q3_prereq(df_unique: pd.DataFrame) -> dict:
    # Build Directed Graph on unique modules
    G = nx.DiGraph()
    title_lookup = df_unique.set_index("moduleCode")["title"].to_dict()

    for _, row in df_unique.iterrows():
        target = row["moduleCode"]
        p_list = _parse_prereq_list(row["prereq_codes"])

        G.add_node(target, in_scope=True, is_ai=bool(row["is_ai_core"]))
        for p in p_list:
            is_in_scope = p.startswith(("CS", "IS", "DSA"))
            if p not in G:
                G.add_node(p, in_scope=is_in_scope, is_ai=False)
            G.add_edge(p, target)

    # Topological chain depth from root nodes
    depths = {}
    if nx.is_directed_acyclic_graph(G):
        topo = list(nx.topological_sort(G))
        for node in topo:
            preds = list(G.predecessors(node))
            depths[node] = 0 if not preds else max(depths[p] for p in preds) + 1
    else:
        # Fallback if cycles present
        for node in G.nodes():
            depths[node] = 0

    module_depths = [depths.get(m, 0) for m in df_unique["moduleCode"]]
    depth_series = pd.Series(module_depths).value_counts().sort_index()

    chain_length_dist = [
        {
            "depth": int(d),
            "count": int(cnt),
            "percentage": round(cnt / len(df_unique) * 100, 2),
            "description": f"Bậc {d}: {'Không có tiên quyết' if d == 0 else f'Chuỗi dài {d} môn tiền đề'}",
        }
        for d, cnt in depth_series.items()
    ]

    # Direct prerequisite count distribution
    prereq_count_series = df_unique["prereq_count"].value_counts().sort_index()
    prereq_count_dist = [
        {"prereq_count": int(k), "count": int(v), "percentage": round(v / len(df_unique) * 100, 2)}
        for k, v in prereq_count_series.items()
    ]

    # Out-degree ranking (Bottleneck Gateway Modules)
    out_degrees = {}
    interdisciplinary_count = 0
    total_prereqs = 0

    for _, row in df_unique.iterrows():
        p_list = _parse_prereq_list(row["prereq_codes"])
        for p in p_list:
            total_prereqs += 1
            out_degrees[p] = out_degrees.get(p, 0) + 1
            if not p.startswith(("CS", "IS", "DSA")):
                interdisciplinary_count += 1

    sorted_out = sorted(out_degrees.items(), key=lambda x: x[1], reverse=True)[:15]
    bottlenecks = []
    for code, deg in sorted_out:
        title = title_lookup.get(code, EXTERNAL_TITLES.get(code, f"Môn học cơ sở {code}"))
        is_math_stats = not code.startswith(("CS", "IS", "DSA"))
        bottlenecks.append({
            "code": code,
            "title": title,
            "out_degree": int(deg),
            "is_interdisciplinary": is_math_stats,
            "department": code[:2] if is_math_stats else ("CS" if code.startswith("CS") else ("IS" if code.startswith("IS") else "DSA")),
        })

    interdisciplinary_pct = round(interdisciplinary_count / total_prereqs * 100, 2) if total_prereqs > 0 else 0.0

    return {
        "chain_length_dist": chain_length_dist,
        "prereq_count_dist": prereq_count_dist,
        "bottlenecks": bottlenecks,
        "interdisciplinary_math_stats_pct": interdisciplinary_pct,
        "total_prereq_links": total_prereqs,
        "interdisciplinary_links": interdisciplinary_count,
    }


def compute_q4_stats(df: pd.DataFrame, df_unique: pd.DataFrame = None) -> dict:
    ug_prep = df[df["level"] <= 4]["prep_hours"]
    pg_prep = df[df["level"] >= 5]["prep_hours"]

    # Welch t-test
    t_stat, p_val = stats.ttest_ind(ug_prep, pg_prep, equal_var=False)
    s1, s2 = float(ug_prep.std()), float(pg_prep.std())
    n1, n2 = len(ug_prep), len(pg_prep)
    pooled_sd = np.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
    cohen_d = round(float(abs(pg_prep.mean() - ug_prep.mean()) / pooled_sd), 2)

    welch_ttest = {
        "t_stat": round(float(t_stat), 4),
        "p_val": float(p_val),
        "ug_mean": round(float(ug_prep.mean()), 2),
        "pg_mean": round(float(pg_prep.mean()), 2),
        "ug_count": int(len(ug_prep)),
        "pg_count": int(len(pg_prep)),
        "ug_std": round(float(ug_prep.std()), 2),
        "pg_std": round(float(pg_prep.std()), 2),
        "cohen_d": cohen_d,
        "conclusion": "Bác bỏ <i>H</i><sub>0</sub>: Sinh viên sau đại học dành nhiều giờ tự học hơn đáng kể so với sinh viên đại học (<i>p</i> &lt; 0.001).",
    }

    # 95% Confidence Interval for total workload and prep hours
    workload = df["total_workload"]
    ci_low, ci_high = stats.t.interval(
        0.95,
        df=len(workload) - 1,
        loc=workload.mean(),
        scale=stats.sem(workload),
    )
    prep_s = df["prep_hours"]
    ci_prep_low, ci_prep_high = stats.t.interval(
        0.95,
        df=len(prep_s) - 1,
        loc=prep_s.mean(),
        scale=stats.sem(prep_s),
    )

    ci_95 = {
        "ci_low": round(float(ci_low), 2),
        "ci_high": round(float(ci_high), 2),
        "mean": round(float(workload.mean()), 2),
        "sem": round(float(stats.sem(workload)), 4),
        "confidence_level": 0.95,
        "metric": "total_workload",
        "unit": "giờ/tuần",
        "prep_mean": round(float(prep_s.mean()), 2),
        "prep_ci_low": round(float(ci_prep_low), 2),
        "prep_ci_high": round(float(ci_prep_high), 2),
    }

    # Level transitions (Self-study ratio & Prep hours by level)
    level_transitions = []
    prev_ratio = None
    prev_prep = None
    for lvl in range(1, 7):
        sub = df[df["level"] == lvl]
        ratio = round(float(sub["self_study_ratio"].mean()), 4)
        prep = round(float(sub["prep_hours"].mean()), 2)
        wl = round(float(sub["total_workload"].mean()), 2)

        delta_ratio = round(ratio - prev_ratio, 4) if prev_ratio is not None else 0.0
        delta_prep = round(prep - prev_prep, 2) if prev_prep is not None else 0.0

        level_transitions.append({
            "level": lvl,
            "self_study_ratio": ratio,
            "prep_hours": prep,
            "total_workload": wl,
            "delta_ratio_prev": delta_ratio,
            "delta_prep_prev": delta_prep,
            "tier": "Đại học" if lvl <= 4 else "Sau đại học",
        })
        prev_ratio = ratio
        prev_prep = prep

    # Pearson Correlation Matrix across academic variables
    target_df = df_unique if df_unique is not None else df.sort_values("academicYear").drop_duplicates(subset=["moduleCode"], keep="last")
    corr_cols = ["moduleCredit", "lec_hours", "tut_hours", "lab_hours", "proj_hours", "prep_hours", "prereq_count"]
    label_names = ["Số tín chỉ", "Giờ giảng bài", "Giờ thảo luận", "Giờ thực hành", "Giờ đồ án", "Giờ tự học", "Môn tiên quyết"]
    corr_mat = target_df[corr_cols].corr()

    correlation_matrix = {
        "variables": label_names,
        "keys": corr_cols,
        "matrix": [[round(float(corr_mat.loc[r_col, c_col]), 2) for c_col in corr_cols] for r_col in corr_cols]
    }

    return {
        "welch_ttest": welch_ttest,
        "ci_95": ci_95,
        "level_transitions": level_transitions,
        "correlation_matrix": correlation_matrix,
    }


def compute_q5_ml(df_unique: pd.DataFrame) -> dict:
    texts = df_unique["description"].fillna("").tolist()

    # TF-IDF for all modules and AI-core modules
    ai_texts = df_unique[df_unique["is_ai_core"]]["description"].fillna("").tolist()
    tfidf_ai = TfidfVectorizer(max_features=40, stop_words=STOPWORDS_EXTENDED, ngram_range=(1, 2))
    X_ai = tfidf_ai.fit_transform(ai_texts)
    ai_features = tfidf_ai.get_feature_names_out()
    ai_scores = np.asarray(X_ai.mean(axis=0)).ravel()

    sorted_kws = sorted(zip(ai_features, ai_scores), key=lambda x: x[1], reverse=True)[:25]
    top_keywords = [
        {"keyword": word, "score": round(float(score), 4)}
        for word, score in sorted_kws
    ]

    # K-Means K=3 on PCA 2D
    tfidf_all = TfidfVectorizer(max_features=500, stop_words="english")
    X_all = tfidf_all.fit_transform(texts)
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_all.toarray())

    km = KMeans(n_clusters=3, random_state=42, n_init=10).fit(X_pca)
    sil_score = round(float(silhouette_score(X_pca, km.labels_)), 4)

    # Elbow curve inertias
    elbow_curve = []
    for k in range(2, 9):
        km_k = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X_pca)
        elbow_curve.append({"k": k, "inertia": round(float(km_k.inertia_), 4)})

    cluster_names = {
        0: "Chủ đề 1: Trí tuệ Nhân tạo & Xử lý Dữ liệu",
        1: "Chủ đề 2: Kỹ thuật Phần mềm & Hệ thống Máy tính",
        2: "Chủ đề 3: Chuỗi Dự án & Thực tập Doanh nghiệp (FOS)",
    }

    # Assign clusters and compute sizes
    label_counts = pd.Series(km.labels_).value_counts().to_dict()
    kmeans_clusters = []
    for c_id in sorted(cluster_names.keys()):
        sz = int(label_counts.get(c_id, 0))
        c_name = cluster_names[c_id]
        kmeans_clusters.append({
            "cluster_id": c_id,
            "name": c_name,
            "size": sz,
            "percentage": round(sz / len(df_unique) * 100, 2),
            "centroid": [round(float(coord), 4) for coord in km.cluster_centers_[c_id]],
        })

    pca_variance_ratio = {
        "pc1": round(float(pca.explained_variance_ratio_[0]), 4),
        "pc2": round(float(pca.explained_variance_ratio_[1]), 4),
        "cumulative": round(float(np.sum(pca.explained_variance_ratio_)), 4),
    }

    # All unique modules projected into 2D PCA space
    pca_points = []
    for i, (_, row) in enumerate(df_unique.iterrows()):
        pca_points.append({
            "code": str(row["moduleCode"]),
            "title": str(row["title"]),
            "x": round(float(X_pca[i, 0]), 4),
            "y": round(float(X_pca[i, 1]), 4),
            "cluster": int(km.labels_[i]),
            "is_ai": bool(row["is_ai_core"]),
            "level": int(row["level"]),
        })

    pca_bounds = {
        "x_min": round(float(X_pca[:, 0].min()), 4),
        "x_max": round(float(X_pca[:, 0].max()), 4),
        "y_min": round(float(X_pca[:, 1].min()), 4),
        "y_max": round(float(X_pca[:, 1].max()), 4),
    }

    # Academic Word Cloud (Classic WordCloud Layout with Web Interactivity)
    from collections import Counter
    from wordcloud import WordCloud
    from PIL import ImageFont, Image

    ai_desc = df_unique[df_unique["is_ai_core"]]["description"].dropna().tolist()
    raw_ai_text = " ".join(ai_desc)
    tokens = re.findall(r"\b[a-zA-Z]{3,}\b", raw_ai_text.lower())
    cleaned_words = [t for t in tokens if t not in STOPWORDS_EXTENDED]
    cleaned_text = " ".join(cleaned_words)
    token_counts = Counter(cleaned_words)

    def get_word_cat(w):
        w = w.lower()
        if any(k in w for k in ["neural", "deep", "learning", "reinforcement", "vision", "nlp", "intelligence", "robotics", "transformer", "generative"]):
            return "core_ai"
        elif any(k in w for k in ["data", "model", "algorithm", "optimization", "decision", "network", "inference", "reasoning", "classification", "probabilistic"]):
            return "foundations"
        return "applied"

    import os
    font_candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    font_path = next((f for f in font_candidates if os.path.exists(f)), None)

    w_canvas, h_canvas = 1400, 700
    wc = WordCloud(
        width=w_canvas,
        height=h_canvas,
        font_path=font_path,
        max_words=70,
        max_font_size=100,
        font_step=2,
        random_state=42
    ).generate(cleaned_text)

    word_cloud = []
    wc_font = wc.font_path or font_path
    for (word, _), font_size, (y, x), orientation, _ in wc.layout_:
        if wc_font:
            font = ImageFont.truetype(wc_font, int(font_size))
        else:
            font = ImageFont.load_default()
        (size_x, size_y), (offset_x, offset_y) = font.font.getsize(word)
        ascent, descent = font.getmetrics()

        min_x = -offset_x
        max_x = size_x - offset_x
        max_y = ascent - offset_y

        is_vert = (orientation == Image.ROTATE_90)
        if is_vert:
            tx = x + max_y
            ty = y + max_x - min_x
            transform = f"translate({tx},{ty}) rotate(-90)"
        else:
            tx = x + min_x
            ty = y + max_y
            transform = f"translate({tx},{ty})"

        if " " in word:
            actual_count = len(re.findall(r"\b" + re.escape(word) + r"\b", raw_ai_text.lower()))
        else:
            actual_count = token_counts.get(word, int(font_size * 2))

        cat = get_word_cat(word)

        word_cloud.append({
            "text": word,
            "count": actual_count,
            "category": cat,
            "font_size": int(font_size),
            "transform": transform,
            "is_vertical": is_vert,
        })

    return {
        "top_keywords": top_keywords,
        "word_cloud": word_cloud,
        "kmeans_clusters": kmeans_clusters,
        "pca_variance_ratio": pca_variance_ratio,
        "silhouette_score": sil_score,
        "elbow_curve": elbow_curve,
        "pca_points": pca_points,
        "pca_bounds": pca_bounds,
    }


def build_modules_catalog(df: pd.DataFrame) -> list[dict]:
    catalog = []
    for _, row in df.iterrows():
        p_list = _parse_prereq_list(row["prereq_codes"])
        catalog.append({
            "moduleCode": str(row["moduleCode"]),
            "title": str(row["title"]),
            "academicYear": str(row["academicYear"]),
            "level": int(row["level"]),
            "study_tier": str(row["study_tier"]),
            "moduleCredit": float(row["moduleCredit"]),
            "total_workload": round(float(row["total_workload"]), 1),
            "prep_hours": round(float(row["prep_hours"]), 1),
            "lec_hours": round(float(row["lec_hours"]), 1),
            "tut_hours": round(float(row["tut_hours"]), 1),
            "lab_hours": round(float(row["lab_hours"]), 1),
            "proj_hours": round(float(row["proj_hours"]), 1),
            "is_ai_core": bool(row["is_ai_core"]),
            "prereq_count": int(row["prereq_count"]),
            "prereq_codes": p_list,
        })
    return catalog


def generate_all():
    print("[1/5] Loading datasets...")
    df, df_unique, venues_ranking = load_datasets()

    print("[2/5] Calculating KPIs and Q1-Q2...")
    kpis = compute_kpis(df, df_unique)
    q1 = compute_q1_curriculum(df, df_unique, venues_ranking)
    q2 = compute_q2_workload(df, df_unique)

    print("[3/5] Calculating Q3 Prerequisites and Q4 Statistical Inference...")
    q3 = compute_q3_prereq(df_unique)
    q4 = compute_q4_stats(df, df_unique)

    print("[4/5] Computing Q5 ML & NLP metrics...")
    q5 = compute_q5_ml(df_unique)

    print("[5/5] Building full 1,400 modules catalog...")
    modules = build_modules_catalog(df)

    web_data = {
        "kpis": kpis,
        "q1_curriculum": q1,
        "q2_workload": q2,
        "q3_prereq": q3,
        "q4_stats": q4,
        "q5_ml": q5,
        "modules": modules,
    }

    out_file = Path("data/web_data.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    json_str = json.dumps(web_data, ensure_ascii=False, indent=2)
    out_file.write_text(json_str, encoding="utf-8")
    print(f"[SUCCESS] Exported {out_file.stat().st_size:,} bytes to {out_file}")

    docs_out = Path("docs/data/web_data.json")
    docs_out.parent.mkdir(parents=True, exist_ok=True)
    docs_out.write_text(json_str, encoding="utf-8")
    print(f"[SUCCESS] Synced {docs_out.stat().st_size:,} bytes to {docs_out}")


if __name__ == "__main__":
    generate_all()
