# Phân tích định lượng chương trình đào tạo CS và AI tại NUS (2022 – 2027)

> ### 🎓 Academic & Educational Disclaimer
> **Notice**: This repository is a **personal academic project** developed strictly for learning, research, and educational purposes.
>
> This project is **not affiliated with, endorsed by, or officially connected to** the **National University of Singapore (NUS)** or the **NUSMods** platform. All curriculum data is retrieved from the public [NUSMods API v2](https://api.nusmods.com/v2/) for educational data mining and analytical demonstration.
>
> **Design Attribution**: UI and visual direction inspired by [Kott Studio](https://kott.studio).

## Hướng dẫn cài đặt và thực thi

Dự án trang bị trình điều phối trung tâm [run.py](file:///c:/Users/bin31/PycharmProjects/dsmidtest_nus-cs-curriculum-analytics/run.py) tự động kiểm tra và cài đặt các thư viện cần thiết trước khi khởi chạy:

```bash
# Cài đặt các gói thư viện phụ thuộc
pip install -r requirements.txt

# Thực thi toàn bộ đường ống xử lý 3 giai đoạn chuẩn
python run.py

# Chạy nhanh khi đã có dữ liệu sạch (Bỏ qua bước thu thập lại từ API)
python run.py --skip-data

# Có thể trực tiếp mở index.html sau khi chạy code.
```

## Thông tin dự án
- **Nguồn dữ liệu:** [NUSMods API v2](https://api.nusmods.com/v2/) (Dữ liệu học phần công khai của Đại học Quốc gia Singapore).
- **Cảm hứng thiết kế giao diện:** Lấy cảm hứng từ ngôn ngữ thị giác tối giản của [Kott Studio](https://kott.studio/) (*UI and visual direction inspired by Kott Studio*).
- **Mục đích:** Dự án cá nhân phục vụ mục đích nghiên cứu học thuật và giáo dục (Personal academic project for educational purposes only).
- **Giấy phép:** MIT License.
