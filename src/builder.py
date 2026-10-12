"""
Trình biên dịch cổng thông tin web tĩnh Hallmark Workbench.
Nạp dữ liệu phân tích từ web_data.json, sinh bảng động và ghép vào src/templates/index.html.
"""

import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


def generate_html(output_file: Path | None = None) -> Path:
    # Nạp dữ liệu web_data.json
    data_path = ROOT_DIR / "data" / "web_data.json"
    if not data_path.exists():
        data_path = ROOT_DIR / "docs" / "data" / "web_data.json"
    if not data_path.exists():
        raise FileNotFoundError("web_data.json not found in data/ or docs/data/. Run pipeline first.")

    web_data_json = data_path.read_text(encoding="utf-8")
    data = json.loads(web_data_json)

    kpis = data["kpis"]
    q1 = data["q1_curriculum"]
    q2 = data["q2_workload"]
    q3 = data["q3_prereq"]
    q4 = data["q4_stats"]
    q5 = data["q5_ml"]

    # Sinh các khối bảng động
    # Phân bố cấp độ Level 1 - 6
    lvl_rows = "".join(
        f"<tr class='work-index-row'><td><span class='badge-pill badge-neutral font-mono'>0{r['level']}/ Level {r['level']}</span></td>"
        f"<td class='font-medium'>{r['tier_label']}</td>"
        f"<td class='text-right font-mono font-bold'>{r['count']:,}</td>"
        f"<td class='text-right font-mono text-muted'>{r['percentage']}%</td></tr>"
        for r in q1["level_distribution"]
    )

    # Phân bố định mức tín chỉ MCs
    credit_rows = "".join(
        f"<tr><td><span class='badge-pill {'badge-primary' if r['credit'] == 4.0 else 'badge-neutral'} font-mono'>{r['credit']} MCs</span></td>"
        f"<td class='text-right font-mono font-bold'>{r['count']:,}</td>"
        f"<td class='text-right font-mono {'text-accent font-bold' if r['credit'] == 4.0 else 'text-muted'}'>{r['percentage']}%</td></tr>"
        for r in q1["credit_distribution"]
    )

    # Môn học cửa ngõ
    bottleneck_rows = "".join(
        f"<tr><td><code class='module-code'>{b['code']}</code></td>"
        f"<td class='font-medium'>{b['title']}</td>"
        f"<td><span class='badge-pill {'badge-accent' if b['is_interdisciplinary'] else 'badge-primary'}'>{'Liên ngành Toán/Thống kê' if b['is_interdisciplinary'] else 'Cốt lõi Khoa học Máy tính'}</span></td>"
        f"<td class='text-right font-mono font-bold text-accent'>{b['out_degree']} môn</td></tr>"
        for b in q3["bottlenecks"]
    )

    # Thẻ từ khóa TF-IDF
    keywords_chips = "".join(
        f"<span class='keyword-chip'><span class='kw-text'>{kw['keyword']}</span><span class='kw-score font-mono'>{kw['score']}</span></span>"
        for kw in q5["top_keywords"]
    )

    # Thẻ tóm tắt 3 cụm K-Means
    cluster_cards = "".join(
        f"<div class='cluster-card'>"
        f"<div class='cluster-header'><span class='kpi-tag'>Cụm {idx+1}</span><span class='cluster-share font-mono'>{c['percentage']}%</span></div>"
        f"<h4 class='cluster-title'>{c['name']}</h4>"
        f"<div class='cluster-metric font-mono'>{c['size']} <span class='cluster-unit'>học phần</span></div>"
        f"<p class='cluster-desc'>Tâm cụm PCA 2D: <span class='font-mono text-muted'>[{c['centroid'][0]:.2f}, {c['centroid'][1]:.2f}]</span></p>"
        f"</div>"
        for idx, c in enumerate(q5["kmeans_clusters"])
    )

    # Cơ cấu khối lượng học tập hàng tuần
    wl = q2["components_mean"]
    wl_rows = f"""
    <tr><td><span class='badge-pill badge-accent'>Chuẩn bị &amp; tự học</span></td><td class='text-right font-mono font-bold text-accent'>{wl['prep_hours']}h</td><td class='text-right font-mono'>47.4%</td></tr>
    <tr><td><span class='badge-pill badge-primary'>Bài giảng lý thuyết</span></td><td class='text-right font-mono font-bold'>{wl['lec_hours']}h</td><td class='text-right font-mono'>23.4%</td></tr>
    <tr><td><span class='badge-pill badge-neutral'>Thảo luận nhóm</span></td><td class='text-right font-mono font-bold'>{wl['tut_hours']}h</td><td class='text-right font-mono'>10.9%</td></tr>
    <tr><td><span class='badge-pill badge-neutral'>Thực hành phòng lab</span></td><td class='text-right font-mono font-bold'>{wl['lab_hours']}h</td><td class='text-right font-mono'>10.2%</td></tr>
    <tr><td><span class='badge-pill badge-neutral'>Đồ án môn học</span></td><td class='text-right font-mono font-bold'>{wl['proj_hours']}h</td><td class='text-right font-mono'>8.2%</td></tr>
    <tr class='table-total-row'><td><b>Tổng khối lượng hàng tuần</b></td><td class='text-right font-mono font-bold text-primary'>{wl['total_workload']}h/tuần</td><td class='text-right font-mono font-bold'>100.0%</td></tr>
    """

    # Bảng chuyển dịch tỷ lệ tự học qua các cấp độ (Q4.3)
    trans_rows = "".join(
        f"<tr><td><span class='badge-pill badge-neutral font-mono'>Level {t['level']}</span></td>"
        f"<td>{t['tier']}</td>"
        f"<td class='text-right font-mono'>{t['total_workload']}h</td>"
        f"<td class='text-right font-mono font-bold text-accent'>{t['prep_hours']}h</td>"
        f"<td class='text-right font-mono font-bold'>{round(t['self_study_ratio'] * 100, 1)}%</td>"
        f"<td class='text-right font-mono {'text-accent' if t['delta_ratio_prev'] > 0 else 'text-muted'}'>{'+' if t['delta_ratio_prev'] > 0 else ''}{round(t['delta_ratio_prev'] * 100, 1)}%</td></tr>"
        for t in q4["level_transitions"]
    )

    # Nạp khung sườn HTML template
    template_path = ROOT_DIR / "src" / "templates" / "index.html"
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found at {template_path}")
    html_template = template_path.read_text(encoding="utf-8")

    # Thay thế các placeholder
    replacements = {
        "{{total_modules}}": f"{kpis['total_modules']:,}",
        "{{unique_modules}}": str(kpis["unique_modules"]),
        "{{avg_workload}}": str(kpis["avg_workload"]),
        "{{median_workload}}": str(kpis["median_workload"]),
        "{{prep_hours}}": str(wl["prep_hours"]),
        "{{lvl_rows}}": lvl_rows,
        "{{credit_rows}}": credit_rows,
        "{{bottleneck_rows}}": bottleneck_rows,
        "{{keywords_chips}}": keywords_chips,
        "{{cluster_cards}}": cluster_cards,
        "{{wl_rows}}": wl_rows,
        "{{trans_rows}}": trans_rows,
        "{{web_data_json}}": web_data_json,
    }

    html_content = html_template
    for placeholder, val in replacements.items():
        html_content = html_content.replace(placeholder, val)

    # Xuất bản ra docs/index.html
    out_path = output_file or (ROOT_DIR / "docs" / "index.html")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html_content, encoding="utf-8")
    print(f"[SUCCESS] Compiled Hallmark Workbench {out_path} ({len(html_content):,} bytes)")
    return out_path


if __name__ == "__main__":
    generate_html()
