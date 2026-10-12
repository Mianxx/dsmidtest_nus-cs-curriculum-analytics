"""
Tùy chọn:
  python run.py             : Chạy toàn bộ pipeline chuẩn 3 giai đoạn (mặc định)
  python run.py --skip-data : Bỏ qua thu thập lại API nếu đã có cleaned_nus_cs.csv
"""

import argparse
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "src"))


def ensure_requirements(auto_install: bool = True):
    import importlib.util

    required_modules = {
        "requests": "requests",
        "numpy": "numpy",
        "pandas": "pandas",
        "scipy": "scipy",
        "sklearn": "scikit-learn",
        "networkx": "networkx",
        "matplotlib": "matplotlib",
        "seaborn": "seaborn",
        "plotly": "plotly",
        "folium": "folium",
        "wordcloud": "wordcloud",
        "PIL": "pillow",
        "pytest": "pytest",
    }

    missing_pkgs = []
    for mod_name, pkg_name in required_modules.items():
        if importlib.util.find_spec(mod_name) is None:
            missing_pkgs.append(pkg_name)

    if not missing_pkgs:
        return True

    print("\n=======================================================")
    print(f" [KIỂM TRA HỆ THỐNG] Phát hiện thiếu {len(missing_pkgs)} thư viện phụ thuộc:")
    for pkg in missing_pkgs:
        print(f"   - {pkg}")
    print("=======================================================")

    if not auto_install:
        print("\n[LỖI] Chế độ tự động cài đặt bị tắt. Vui lòng cài đặt thủ công:")
        print(f"  {sys.executable} -m pip install -r requirements.txt")
        sys.exit(1)

    req_file = ROOT_DIR / "requirements.txt"
    if req_file.exists():
        print(f"[TIẾN HÀNH] Đang tự động cài đặt từ {req_file.name} qua pip...")
        cmd = [sys.executable, "-m", "pip", "install", "-r", str(req_file)]
    else:
        print(f"[TIẾN HÀNH] Đang tự động cài đặt các gói thiếu qua pip: {' '.join(missing_pkgs)}...")
        cmd = [sys.executable, "-m", "pip", "install"] + missing_pkgs

    try:
        subprocess.run(cmd, check=True)
        print("[THÀNH CÔNG] Đã hoàn tất cài đặt toàn bộ thư viện! Tiếp tục khởi chạy pipeline...\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[LỖI CÀI ĐẶT] Không thể tự động cài đặt thư viện qua pip (Mã lỗi: {e.returncode}).")
        print("Vui lòng kích hoạt môi trường ảo và chạy thủ công lệnh:")
        print(f"  {sys.executable} -m pip install -r requirements.txt")
        sys.exit(1)


ensure_requirements(auto_install=True)

from loader import clean_and_export_all
from analytics import generate_all
from builder import generate_html


def run_data_pipeline():
    print("\n=======================================================")
    print(" [Giai đoạn 1/3] Thu thập, làm sạch và chuẩn hóa dữ liệu")
    print("=======================================================")
    df_all, df_unique, venues = clean_and_export_all(data_dir=ROOT_DIR / "data")
    return df_all


def run_analytics_pipeline():
    print("\n=======================================================")
    print(" [Giai đoạn 2/3] Tính toán chỉ số thống kê & mô hình ML")
    print("=======================================================")
    generate_all()


def run_builder_pipeline():
    print("\n=======================================================")
    print(" [Giai đoạn 3/3] Biên dịch cổng thông tin tĩnh docs/index.html")
    print("=======================================================")
    out_html = generate_html()
    print(f"[XONG] Trang web tĩnh đã sẵn sàng tại {out_html}")


def main():
    parser = argparse.ArgumentParser(
        description="Điểm điều phối duy nhất cho toàn bộ hệ thống NUS CS Curriculum Analytics"
    )
    parser.add_argument(
        "--skip-data",
        action="store_true",
        help="Bỏ qua thu thập và làm sạch lại dữ liệu nếu đã có sẵn data/cleaned_nus_cs.csv"
    )

    args = parser.parse_args()

    if not args.skip_data:
        run_data_pipeline()
    else:
        print("\n[BỎ QUA] Sử dụng dữ liệu đã có trong data/cleaned_nus_cs.csv")

    run_analytics_pipeline()
    run_builder_pipeline()

    print("\n=======================================================")
    print(" [HOÀN THÀNH] Toàn bộ pipeline đã thực thi thành công!")
    print("=======================================================")


if __name__ == "__main__":
    main()
