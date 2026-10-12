"""
run.py — Điểm điều phối duy nhất cho toàn bộ hệ thống NUS CS Curriculum Analytics.

Chạy toàn bộ pipeline cốt lõi 3 giai đoạn:
  1. Thu thập và làm sạch dữ liệu (src.loader)
  2. Tính toán phân tích định lượng & mô hình ML (src.analytics)
  3. Biên dịch cổng thông tin web tĩnh chuẩn bị triển khai (src.builder)

Tùy chọn:
  python run.py             : Chạy toàn bộ pipeline chuẩn 3 giai đoạn (mặc định)
  python run.py --skip-data : Bỏ qua thu thập lại API nếu đã có cleaned_nus_cs.csv
  python run.py --serve     : Khởi chạy HTTP server cục bộ xem trang web docs/
  python run.py --export-pdf: (Tùy chọn) Xuất báo cáo PDF nếu có export_pdf.py
  python run.py --export-docx: (Tùy chọn) Xuất báo cáo Word nếu có export_docx.py
"""

import argparse
import http.server
import socketserver
import subprocess
import sys
import webbrowser
from pathlib import Path

# Cấu hình UTF-8 cho stdout/stderr trên Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Đảm bảo import được module từ thư mục src
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "src"))


def ensure_requirements(auto_install: bool = True):
    """Kiểm tra và tự động cài đặt các thư viện cần thiết trước khi khởi chạy pipeline."""
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


# 1. Tự động kiểm tra và cài đặt thư viện phụ thuộc trước khi import
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


def serve_docs(port: int = 8000):
    docs_dir = ROOT_DIR / "docs"
    print(f"\n[HTTP SERVER] Đang phục vụ thư mục docs/ tại http://localhost:{port}")
    print("Nhấn Ctrl + C để dừng máy chủ.\n")
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(docs_dir), **kwargs)

    webbrowser.open(f"http://localhost:{port}/index.html")
    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[HTTP SERVER] Đã dừng máy chủ.")


def export_storytelling_pdf():
    pdf_script = ROOT_DIR / "export_pdf.py"
    if not pdf_script.exists():
        print("\n[THÔNG BÁO] Không tìm thấy export_pdf.py, bỏ qua xuất PDF.")
        return
    try:
        import export_pdf
        print("\n=======================================================")
        print(" [Phụ lục] Xuất báo cáo kể chuyện dữ liệu ra PDF (1 trang A4)")
        print("=======================================================")
        export_pdf.build_pdf()
    except Exception as e:
        print(f"[CẢNH BÁO] Không thể xuất PDF: {e}")


def export_storytelling_docx():
    docx_script = ROOT_DIR / "export_docx.py"
    if not docx_script.exists():
        print("\n[THÔNG BÁO] Không tìm thấy export_docx.py, bỏ qua xuất Word.")
        return
    try:
        import export_docx
        print("\n=======================================================")
        print(" [Phụ lục] Xuất báo cáo kể chuyện dữ liệu ra Word (.docx)")
        print("=======================================================")
        export_docx.build_docx()
    except Exception as e:
        print(f"[CẢNH BÁO] Không thể xuất Word: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Điểm điều phối duy nhất cho toàn bộ hệ thống NUS CS Curriculum Analytics"
    )
    parser.add_argument(
        "--serve", "-s",
        action="store_true",
        help="Khởi chạy HTTP server cục bộ mở docs/index.html trên trình duyệt"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Cổng kết nối khi chạy HTTP server (mặc định: 8000)"
    )
    parser.add_argument(
        "--skip-data",
        action="store_true",
        help="Bỏ qua bước làm sạch dữ liệu nếu cleaned_nus_cs.csv đã có sẵn"
    )
    parser.add_argument(
        "--export-pdf",
        action="store_true",
        help="Xuất báo cáo kể chuyện dữ liệu (Storytelling with Data) ra tệp PDF A4"
    )
    parser.add_argument(
        "--export-docx",
        action="store_true",
        help="Xuất báo cáo kể chuyện dữ liệu (Storytelling with Data) ra tệp Word (.docx)"
    )
    args = parser.parse_args()

    if not args.skip_data:
        run_data_pipeline()
    else:
        print("\n[BỎ QUA] Sử dụng dữ liệu đã có trong data/cleaned_nus_cs.csv")

    run_analytics_pipeline()
    run_builder_pipeline()

    if args.export_pdf:
        export_storytelling_pdf()
    if args.export_docx:
        export_storytelling_docx()

    print("\n=======================================================")
    print(" [HOÀN THÀNH] Toàn bộ pipeline đã thực thi thành công!")
    print("=======================================================")

    if args.serve:
        serve_docs(args.port)


if __name__ == "__main__":
    main()
