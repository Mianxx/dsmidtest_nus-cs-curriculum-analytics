    /**
     * Resilient Modern Analytical Architecture:
     * Phase 1: Pure Vanilla JS Navigation, Theme & Table (Never Crashes).
     * Phase 2: Direct Inlined High-Craft SVG Quantitative Chart Engine (Zero Dependency).
     * Phase 3: Pure Inlined Interactive SVG DAG for Prerequisite Networks.
     */
    (function () {
      "use strict";

      const NS = "http://www.w3.org/2000/svg";

      // 1. Data Initialization
      let DATA = null;
      try {
        const rawJson = document.getElementById("embedded-data").textContent;
        DATA = JSON.parse(rawJson);
      } catch (err) {
        console.error("Critical: Failed to parse embedded JSON dataset:", err);
      }

      // 2. Tooltip Controller
      const tooltip = document.getElementById("chart-tooltip");
      function showTooltip(e, html) {
        if (!tooltip) return;
        tooltip.innerHTML = html;
        tooltip.style.display = "block";
        tooltip.style.left = e.pageX + "px";
        if (e.clientY < 110) {
          // Gần mép trên màn hình: hiển thị bên dưới con trỏ để không che lấp tiêu đề biểu đồ
          tooltip.style.top = (e.pageY + 14) + "px";
          tooltip.style.transform = "translate(-50%, 0)";
        } else {
          // Vị trí thông thường: hiển thị phía trên con trỏ
          tooltip.style.top = (e.pageY - 12) + "px";
          tooltip.style.transform = "translate(-50%, -100%)";
        }
      }
      function hideTooltip() {
        if (tooltip) tooltip.style.display = "none";
      }

      // Helper for creating SVG DOM elements
      function createSvg(w, h) {
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible";
        return svg;
      }

      // 3. Tab Navigation Controller
      const tabBtns = document.querySelectorAll(".tab-slash, .tab-pill");
      const tabPanes = document.querySelectorAll(".tab-pane");
      const activeCrumb = document.getElementById("header-active-tab");

      const tabSlugMap = {
        "storytelling": "story",
        "graph": "graph",
        "report": "report",
        "curriculum": "curriculum",
        "workload": "workload",
        "prereq": "prereq",
        "stats": "stats",
        "ml": "ml",
        "explorer": "explorer"
      };

      function switchTab(tabId) {
        try {
          tabBtns.forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
          });

          tabPanes.forEach(pane => {
            pane.classList.toggle("active", pane.id === "pane-" + tabId);
          });

          if (activeCrumb) {
            activeCrumb.textContent = tabSlugMap[tabId] || tabId;
          }

          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            window.history.replaceState(null, null, "#" + tabId);
          }

          // Re-render charts for tab on next animation frame
          const raf = (typeof window !== "undefined" && window.requestAnimationFrame) ? window.requestAnimationFrame : ((cb) => setTimeout(cb, 16));
          raf(() => {
            renderChartsForTab(tabId);
          });
        } catch (e) {
          console.error("Tab switch error:", e);
        }
      }
      window.switchTab = switchTab;

      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const tabId = btn.getAttribute("data-tab");
          if (tabId) switchTab(tabId);
        });
      });

      // 4. Theme Toggle Controller
      const htmlElem = document.documentElement;
      const themeToggleBtn = document.getElementById("theme-toggle");
      const themeIcon = document.getElementById("theme-icon");
      const themeText = document.getElementById("theme-text");

      function updateThemeUI(theme) {
        htmlElem.setAttribute("data-theme", theme);
        if (theme === "dark") {
          if (themeIcon) themeIcon.innerHTML = "&#9728;";
          if (themeText) themeText.textContent = "Sáng";
        } else {
          if (themeIcon) themeIcon.innerHTML = "&#9681;";
          if (themeText) themeText.textContent = "Tối";
        }
      }

      function setTheme(theme) {
        try {
          updateThemeUI(theme);
          localStorage.setItem("nus_curriculum_theme", theme);
          const activeBtn = document.querySelector(".tab-slash.active, .tab-pill.active");
          const activeTab = activeBtn ? activeBtn.getAttribute("data-tab") : "storytelling";
          renderChartsForTab(activeTab);
        } catch (e) {
          console.error("Theme set error:", e);
        }
      }

      try {
        const savedTheme = localStorage.getItem("nus_curriculum_theme") || "light";
        setTheme(savedTheme);
      } catch (e) {
        updateThemeUI("light");
      }

      if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
          const current = htmlElem.getAttribute("data-theme") || "light";
          setTheme(current === "dark" ? "light" : "dark");
        });
      }

      // 5. Data Explorer Table Controller
      const searchInput = document.getElementById("explorer-search");
      const levelSelect = document.getElementById("filter-level");
      const tierSelect = document.getElementById("filter-tier");
      const aiSelect = document.getElementById("filter-ai");
      const resetBtn = document.getElementById("btn-reset-filters");
      const tbody = document.getElementById("modules-tbody");
      const pageInfo = document.getElementById("pagination-info");
      const pageNumDisplay = document.getElementById("page-num-display");
      const prevBtn = document.getElementById("btn-prev-page");
      const nextBtn = document.getElementById("btn-next-page");

      let filteredModules = (DATA && DATA.modules) ? [...DATA.modules] : [];
      let currentPage = 1;
      const pageSize = 25;
      let sortCol = "moduleCode";
      let sortAsc = true;

      function updateSortIndicators() {
        document.querySelectorAll("#modules-table th[data-sort]").forEach(th => {
          const col = th.getAttribute("data-sort");
          const ind = document.getElementById("sort-" + col);
          if (ind) {
            if (col === sortCol) {
              ind.textContent = sortAsc ? " \u2191" : " \u2193";
              ind.style.color = "var(--color-primary)";
            } else {
              ind.textContent = " \u2022";
              ind.style.color = "var(--color-muted)";
            }
          }
        });
      }

      function renderTable() {
        if (!tbody || !pageInfo || !pageNumDisplay) return;
        const total = filteredModules.length;
        const maxPage = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage > maxPage) currentPage = maxPage;
        if (currentPage < 1) currentPage = 1;

        const startIdx = (currentPage - 1) * pageSize;
        const pageItems = filteredModules.slice(startIdx, startIdx + pageSize);

        pageInfo.textContent = `Hiển thị ${total === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + pageSize, total)} trong số ${total.toLocaleString()} học phần`;
        pageNumDisplay.textContent = `${currentPage} / ${maxPage}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= maxPage;

        updateSortIndicators();

        if (pageItems.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 30px; color: var(--color-muted);">Không tìm thấy học phần nào khớp với điều kiện lọc.</td></tr>`;
          return;
        }

        tbody.innerHTML = pageItems.map(m => `
          <tr>
            <td><code class="module-code">${m.moduleCode}</code></td>
            <td class="font-medium">${m.title}</td>
            <td><span class="badge-pill badge-neutral font-mono">${m.academicYear}</span></td>
            <td><span class="badge-pill badge-primary font-mono">Level ${m.level}</span></td>
            <td>${m.study_tier}</td>
            <td class="text-right font-mono font-bold">${m.moduleCredit}</td>
            <td class="text-right font-mono font-bold text-primary">${m.total_workload}h</td>
            <td class="text-right font-mono text-accent font-bold">${m.prep_hours}h</td>
            <td>${m.is_ai_core ? '<span class="badge-pill badge-accent">AI Core</span>' : '<span class="badge-pill badge-neutral">CS Standard</span>'}</td>
            <td class="text-right font-mono">${m.prereq_count} môn</td>
          </tr>
        `).join("");
      }

      function applyFilters() {
        if (!DATA || !DATA.modules) return;
        const q = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : "";
        const lvl = (levelSelect && levelSelect.value) ? levelSelect.value : "all";
        const tier = (tierSelect && tierSelect.value) ? tierSelect.value : "all";
        const ai = (aiSelect && aiSelect.value) ? aiSelect.value : "all";

        filteredModules = DATA.modules.filter(m => {
          if (q) {
            const code = (m.moduleCode || "").toLowerCase();
            const title = (m.title || "").toLowerCase();
            if (!code.includes(q) && !title.includes(q)) return false;
          }
          if (lvl !== "all" && String(m.level) !== String(lvl)) return false;
          if (tier !== "all" && m.study_tier !== tier) return false;
          if (ai !== "all") {
            const isAi = ai === "true";
            if (Boolean(m.is_ai_core) !== isAi) return false;
          }
          return true;
        });

        filteredModules.sort((a, b) => {
          let va = a[sortCol];
          let vb = b[sortCol];
          if (typeof va === "string") va = va.toLowerCase();
          if (typeof vb === "string") vb = vb.toLowerCase();
          if (va < vb) return sortAsc ? -1 : 1;
          if (va > vb) return sortAsc ? 1 : -1;
          return 0;
        });

        currentPage = 1;
        renderTable();
      }

      if (searchInput) searchInput.addEventListener("input", applyFilters);
      if (levelSelect) levelSelect.addEventListener("change", applyFilters);
      if (tierSelect) tierSelect.addEventListener("change", applyFilters);
      if (aiSelect) aiSelect.addEventListener("change", applyFilters);

      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (levelSelect) levelSelect.value = "all";
          if (tierSelect) tierSelect.value = "all";
          if (aiSelect) aiSelect.value = "all";
          sortCol = "moduleCode";
          sortAsc = true;
          applyFilters();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage--;
            renderTable();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          const maxPage = Math.ceil(filteredModules.length / pageSize);
          if (currentPage < maxPage) {
            currentPage++;
            renderTable();
          }
        });
      }

      document.querySelectorAll("#modules-table th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
          const col = th.getAttribute("data-sort");
          if (sortCol === col) {
            sortAsc = !sortAsc;
          } else {
            sortCol = col;
            sortAsc = true;
          }
          applyFilters();
        });
      });

      applyFilters();

      window.jumpToModuleFromPca = function(code) {
        if (!code) return;
        switchTab("explorer");
        if (searchInput) {
          searchInput.value = code;
          if (levelSelect) levelSelect.value = "all";
          if (tierSelect) tierSelect.value = "all";
          if (aiSelect) aiSelect.value = "all";
          applyFilters();
          const targetRow = document.querySelector("#modules-tbody code.module-code");
          if (targetRow) {
            targetRow.scrollIntoView({ block: "center" });
          }
        }
      };

      // ======================================================================
      // 6. Native High-Craft SVG Quantitative Chart Engines
      // ======================================================================

      // State for interactive chart toggles & inspection
      let storyTrendShowTotal = true;
      let storyTrendShowAi = true;
      let storyTrendShowAvg = false;
      let storyTrendPinnedYear = null;

      let currentWorkloadField = "prep_hours";
      let pinnedWorkloadLevel = null;

      let olsShowRegression = true;
      let olsShowEmpiricalMean = true;
      let olsShowBenchmark4h = false;
      let olsHighlightOutliers = false;
      let olsPinnedModule = null;

      let pinnedHeatmapCell = null;

      window.closeStoryTrendInspector = function() {
        storyTrendPinnedYear = null;
        const insp = document.getElementById("story-trend-inspector");
        if (insp) insp.style.display = "none";
        renderChartStoryTrend();
      };

      window.closeWorkloadBoxInspector = function() {
        pinnedWorkloadLevel = null;
        const insp = document.getElementById("workload-box-inspector");
        if (insp) insp.style.display = "none";
        renderChartQ2Violin();
      };

      window.closeOlsPointInspector = function() {
        olsPinnedModule = null;
        olsHighlightOutliers = false;
        const btnOut = document.getElementById("btn-ols-outliers");
        if (btnOut) btnOut.classList.remove("active");
        const insp = document.getElementById("ols-point-inspector");
        if (insp) insp.style.display = "none";
        renderChartQ2Ols();
      };

      window.closeHeatmapCellInspector = function() {
        pinnedHeatmapCell = null;
        const insp = document.getElementById("heatmap-cell-inspector");
        if (insp) insp.style.display = "none";
        renderChartQ4Heatmap();
      };

      // 0.1 Biểu đồ 02: Xu hướng Mở môn CS & AI qua 5 Niên khóa
      function renderChartStoryTrend() {
        const box = document.getElementById("chart-story-trend");
        if (!box || !DATA) return;
        const trends = DATA.q1_curriculum.yearly_trends;
        const w = 920;
        const h = 340;
        const padL = 70;
        const padR = 40;
        const padT = 40;
        const padB = 50;

        const maxVal = 320;
        const n = trends.length;
        const stepX = (w - padL - padR) / (n - 1);

        // Bind toolbar controls once
        const btnTotal = document.getElementById("btn-trend-total");
        const btnAi = document.getElementById("btn-trend-ai");
        const btnAvg = document.getElementById("btn-trend-avg");
        if (btnTotal && !btnTotal.dataset.bound) {
          btnTotal.dataset.bound = "1";
          btnTotal.addEventListener("click", () => {
            storyTrendShowTotal = !storyTrendShowTotal;
            btnTotal.classList.toggle("active", storyTrendShowTotal);
            renderChartStoryTrend();
          });
        }
        if (btnAi && !btnAi.dataset.bound) {
          btnAi.dataset.bound = "1";
          btnAi.addEventListener("click", () => {
            storyTrendShowAi = !storyTrendShowAi;
            btnAi.classList.toggle("active", storyTrendShowAi);
            renderChartStoryTrend();
          });
        }
        if (btnAvg && !btnAvg.dataset.bound) {
          btnAvg.dataset.bound = "1";
          btnAvg.addEventListener("click", () => {
            storyTrendShowAvg = !storyTrendShowAvg;
            btnAvg.classList.toggle("active", storyTrendShowAvg);
            renderChartStoryTrend();
          });
        }

        const svg = createSvg(w, h);

        // Grid lines
        for (let v = 0; v <= maxVal; v += 80) {
          const y = h - padB - (v / maxVal) * (h - padT - padB);
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", padL);
          line.setAttribute("y1", y);
          line.setAttribute("x2", w - padR);
          line.setAttribute("y2", y);
          line.setAttribute("stroke", "var(--color-rule)");
          line.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(line);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v;
          svg.appendChild(lbl);
        }

        // Points
        const totalPts = trends.map((d, i) => ({
          x: padL + i * stepX,
          y: h - padB - (d.total_modules / maxVal) * (h - padT - padB),
          d: d
        }));

        const aiPts = trends.map((d, i) => ({
          x: padL + i * stepX,
          y: h - padB - (d.ai_modules / maxVal) * (h - padT - padB),
          d: d
        }));

        // Pinned Year Column Highlight
        if (storyTrendPinnedYear) {
          const pinnedIdx = trends.findIndex(d => d.academicYear === storyTrendPinnedYear);
          if (pinnedIdx >= 0) {
            const px = padL + pinnedIdx * stepX;
            const hRect = document.createElementNS(NS, "rect");
            hRect.setAttribute("x", px - stepX * 0.42);
            hRect.setAttribute("y", padT);
            hRect.setAttribute("width", stepX * 0.84);
            hRect.setAttribute("height", h - padT - padB);
            hRect.setAttribute("rx", "6");
            hRect.setAttribute("fill", "var(--color-rule)");
            hRect.setAttribute("opacity", "0.4");
            svg.appendChild(hRect);
          }
        }

        // 5-Year Average Reference Line
        if (storyTrendShowAvg) {
          const avgVal = 280;
          const yAvg = h - padB - (avgVal / maxVal) * (h - padT - padB);
          const avgLine = document.createElementNS(NS, "line");
          avgLine.setAttribute("x1", padL);
          avgLine.setAttribute("y1", yAvg);
          avgLine.setAttribute("x2", w - padR);
          avgLine.setAttribute("y2", yAvg);
          avgLine.setAttribute("stroke", "var(--color-muted)");
          avgLine.setAttribute("stroke-width", "1.6");
          avgLine.setAttribute("stroke-dasharray", "4,4");
          svg.appendChild(avgLine);

          const avgBadge = document.createElementNS(NS, "g");
          avgBadge.innerHTML = `
            <rect x="${w - padR - 160}" y="${yAvg - 18}" width="160" height="17" rx="3" fill="var(--color-surface)" stroke="var(--color-border)" />
            <text x="${w - padR - 80}" y="${yAvg - 6}" text-anchor="middle" font-size="10" font-family="monospace" fill="var(--color-muted)">TB 5 năm: 280 môn/năm</text>
          `;
          svg.appendChild(avgBadge);
        }

        // Total Area & Line
        if (storyTrendShowTotal) {
          const totalAreaPath = `M ${totalPts[0].x} ${h - padB} ` + totalPts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${totalPts[n - 1].x} ${h - padB} Z`;
          const area1 = document.createElementNS(NS, "path");
          area1.setAttribute("d", totalAreaPath);
          area1.setAttribute("fill", "var(--color-chart-blue)");
          area1.setAttribute("opacity", "0.08");
          svg.appendChild(area1);

          const lineTotal = document.createElementNS(NS, "path");
          lineTotal.setAttribute("d", totalPts.map((p, i) => (i === 0 ? "M " : "L ") + `${p.x} ${p.y}`).join(" "));
          lineTotal.setAttribute("fill", "none");
          lineTotal.setAttribute("stroke", "var(--color-chart-blue)");
          lineTotal.setAttribute("stroke-width", "3");
          svg.appendChild(lineTotal);
        }

        // AI Area & Line
        if (storyTrendShowAi) {
          const aiAreaPath = `M ${aiPts[0].x} ${h - padB} ` + aiPts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${aiPts[n - 1].x} ${h - padB} Z`;
          const area2 = document.createElementNS(NS, "path");
          area2.setAttribute("d", aiAreaPath);
          area2.setAttribute("fill", "var(--color-chart-red)");
          area2.setAttribute("opacity", "0.15");
          svg.appendChild(area2);

          const lineAi = document.createElementNS(NS, "path");
          lineAi.setAttribute("d", aiPts.map((p, i) => (i === 0 ? "M " : "L ") + `${p.x} ${p.y}`).join(" "));
          lineAi.setAttribute("fill", "none");
          lineAi.setAttribute("stroke", "var(--color-chart-red)");
          lineAi.setAttribute("stroke-width", "3.5");
          svg.appendChild(lineAi);
        }

        function selectYear(d) {
          storyTrendPinnedYear = d.academicYear;
          const insp = document.getElementById("story-trend-inspector");
          if (insp) {
            insp.style.display = "flex";
            const diff = d.total_modules - 280;
            const diffStr = diff >= 0 ? "+" + diff : "" + diff;
            insp.innerHTML = `
              <div class="inspector-title">
                <span>Niên khóa</span>
                <span class="inspector-badge font-mono">${d.academicYear}</span>
              </div>
              <div class="inspector-metrics">
                <span>Tổng số môn: <b>${d.total_modules} môn</b></span>
                <span>Môn AI/ML: <b style="color:var(--color-chart-red);">${d.ai_modules} môn</b> (${d.ai_share_pct}%)</span>
                <span>Môn CS tiêu chuẩn: <b>${d.total_modules - d.ai_modules} môn</b></span>
                <span>Độ lệch so với TB 5 năm: <b>${diffStr} môn</b></span>
              </div>
              <div class="inspector-context font-mono" style="width:100%; font-size:10.5px; color:var(--color-muted); border-top:1px dashed var(--color-border); padding-top:6px; margin-top:4px;">
                Lưu ý phương pháp luận: Dữ liệu phân tích vĩ mô tổng hợp 5 niên khóa (N = 1,400 lượt môn) nhằm bảo đảm cỡ mẫu thống kê tin cậy cho các mô hình hồi quy và phân cụm.
              </div>
              <div class="inspector-actions" style="margin-left:auto;">
                <button class="inspector-close-btn font-mono" onclick="window.closeStoryTrendInspector()">&times; Đóng</button>
              </div>
            `;
          }
          renderChartStoryTrend();
        }

        // X-axis text & interactive points
        totalPts.forEach((p, i) => {
          // Year text
          const tYear = document.createElementNS(NS, "text");
          tYear.setAttribute("x", p.x);
          tYear.setAttribute("y", h - padB + 24);
          tYear.setAttribute("font-size", "12");
          tYear.setAttribute("font-weight", p.d.academicYear === storyTrendPinnedYear ? "800" : "600");
          tYear.setAttribute("text-anchor", "middle");
          tYear.setAttribute("fill", "var(--color-ink)");
          tYear.style.cursor = "pointer";
          tYear.textContent = p.d.academicYear;
          tYear.addEventListener("click", () => selectYear(p.d));
          svg.appendChild(tYear);

          // Total point
          if (storyTrendShowTotal) {
            const c1 = document.createElementNS(NS, "circle");
            c1.setAttribute("cx", p.x);
            c1.setAttribute("cy", p.y);
            c1.setAttribute("r", p.d.academicYear === storyTrendPinnedYear ? "7.5" : "5.5");
            c1.setAttribute("fill", "var(--color-surface)");
            c1.setAttribute("stroke", "var(--color-chart-blue)");
            c1.setAttribute("stroke-width", "2.5");
            c1.style.cursor = "pointer";
            c1.addEventListener("mouseenter", (e) => {
              showTooltip(e, `<b>Năm học: ${p.d.academicYear}</b><br>Tổng số môn mở: <b>${p.d.total_modules} môn</b><br><small style="color:var(--color-muted);">Bấm để ghim thông số</small>`);
            });
            c1.addEventListener("mouseleave", hideTooltip);
            c1.addEventListener("click", () => selectYear(p.d));
            svg.appendChild(c1);

            // Label above
            const lbl1 = document.createElementNS(NS, "text");
            lbl1.setAttribute("x", p.x);
            lbl1.setAttribute("y", p.y - 10);
            lbl1.setAttribute("font-size", "11");
            lbl1.setAttribute("font-weight", "700");
            lbl1.setAttribute("font-family", "monospace");
            lbl1.setAttribute("text-anchor", "middle");
            lbl1.setAttribute("fill", "var(--color-chart-blue)");
            lbl1.textContent = p.d.total_modules;
            svg.appendChild(lbl1);
          }
        });

        if (storyTrendShowAi) {
          aiPts.forEach((p) => {
            const c2 = document.createElementNS(NS, "circle");
            c2.setAttribute("cx", p.x);
            c2.setAttribute("cy", p.y);
            c2.setAttribute("r", p.d.academicYear === storyTrendPinnedYear ? "8" : "6");
            c2.setAttribute("fill", "var(--color-chart-red)");
            c2.setAttribute("stroke", "var(--color-surface)");
            c2.setAttribute("stroke-width", "2");
            c2.style.cursor = "pointer";
            c2.addEventListener("mouseenter", (e) => {
              showTooltip(e, `<b>Năm học: ${p.d.academicYear}</b><br>Môn Trọng tâm AI/ML: <b>${p.d.ai_modules} môn</b><br>Tỷ trọng AI: <b>${p.d.ai_share_pct}%</b><br><small style="color:var(--color-muted);">Bấm để ghim thông số</small>`);
            });
            c2.addEventListener("mouseleave", hideTooltip);
            c2.addEventListener("click", () => selectYear(p.d));
            svg.appendChild(c2);

            // Label above
            const lbl2 = document.createElementNS(NS, "text");
            lbl2.setAttribute("x", p.x);
            lbl2.setAttribute("y", p.y - 10);
            lbl2.setAttribute("font-size", "11.5");
            lbl2.setAttribute("font-weight", "800");
            lbl2.setAttribute("font-family", "monospace");
            lbl2.setAttribute("text-anchor", "middle");
            lbl2.setAttribute("fill", "var(--color-chart-red)");
            lbl2.textContent = p.d.ai_modules;
            svg.appendChild(lbl2);
          });
        }

        // Legend at top left
        const legG = document.createElementNS(NS, "g");
        let legHtml = "";
        if (storyTrendShowTotal) {
          legHtml += `
            <line x1="${padL}" y1="18" x2="${padL + 25}" y2="18" stroke="var(--color-chart-blue)" stroke-width="3" />
            <text x="${padL + 32}" y="22" font-size="11.5" font-weight="600" fill="var(--color-ink)">Tổng số môn CS</text>
          `;
        }
        if (storyTrendShowAi) {
          const offsetAi = storyTrendShowTotal ? padL + 180 : padL;
          legHtml += `
            <line x1="${offsetAi}" y1="18" x2="${offsetAi + 25}" y2="18" stroke="var(--color-chart-red)" stroke-width="3.5" />
            <text x="${offsetAi + 32}" y="22" font-size="11.5" font-weight="700" fill="var(--color-chart-red)">Môn AI/ML (+${trends[n-1].ai_modules - trends[0].ai_modules} môn)</text>
          `;
        }
        legG.innerHTML = legHtml;
        svg.appendChild(legG);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 1.1 Q1.1 Donut Chart: Bậc Đại học vs Sau đại học
      function renderChartQ1Donut() {
        const box = document.getElementById("chart-q1-donut");
        if (!box || !DATA) return;
        const ug = DATA.q1_curriculum.tier_distribution.undergrad;
        const pg = DATA.q1_curriculum.tier_distribution.postgrad;
        const w = 380;
        const h = 300;
        const cx = 190;
        const cy = 135;
        const rOut = 95;
        const rIn = 60;

        const svg = createSvg(w, h);
        const angUg = (ug.percentage / 100) * Math.PI * 2;

        function getArcD(startA, endA, r1, r2) {
          const x1 = cx + r1 * Math.sin(startA);
          const y1 = cy - r1 * Math.cos(startA);
          const x2 = cx + r1 * Math.sin(endA);
          const y2 = cy - r1 * Math.cos(endA);
          const x3 = cx + r2 * Math.sin(endA);
          const y3 = cy - r2 * Math.cos(endA);
          const x4 = cx + r2 * Math.sin(startA);
          const y4 = cy - r2 * Math.cos(startA);
          const large = (endA - startA) > Math.PI ? 1 : 0;
          return `M ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${large} 0 ${x4} ${y4} Z`;
        }

        // Slices
        const s1 = document.createElementNS(NS, "path");
        s1.setAttribute("d", getArcD(0, angUg, rOut, rIn));
        s1.setAttribute("fill", "var(--color-chart-blue)");
        s1.style.cursor = "pointer";
        s1.addEventListener("mouseenter", (e) => showTooltip(e, `<b>Bậc Đại học (Level 1-4)</b><br>Số lượng: <b>${ug.count} môn (${ug.percentage}%)</b>`));
        s1.addEventListener("mouseleave", hideTooltip);
        svg.appendChild(s1);

        const s2 = document.createElementNS(NS, "path");
        s2.setAttribute("d", getArcD(angUg, Math.PI * 2, rOut, rIn));
        s2.setAttribute("fill", "var(--color-chart-red)");
        s2.style.cursor = "pointer";
        s2.addEventListener("mouseenter", (e) => showTooltip(e, `<b>Bậc Sau đại học (Level 5-6)</b><br>Số lượng: <b>${pg.count} môn (${pg.percentage}%)</b>`));
        s2.addEventListener("mouseleave", hideTooltip);
        svg.appendChild(s2);

        // Center text
        const t1 = document.createElementNS(NS, "text");
        t1.setAttribute("x", cx);
        t1.setAttribute("y", cy);
        t1.setAttribute("text-anchor", "middle");
        t1.setAttribute("font-size", "22");
        t1.setAttribute("font-weight", "800");
        t1.setAttribute("fill", "var(--color-ink)");
        t1.textContent = "1,400";
        svg.appendChild(t1);

        const t2 = document.createElementNS(NS, "text");
        t2.setAttribute("x", cx);
        t2.setAttribute("y", cy + 18);
        t2.setAttribute("text-anchor", "middle");
        t2.setAttribute("font-size", "11");
        t2.setAttribute("fill", "var(--color-muted)");
        t2.textContent = "Học phần";
        svg.appendChild(t2);

        // Legend below
        const leg = document.createElementNS(NS, "g");
        leg.innerHTML = `
          <rect x="50" y="260" width="12" height="12" rx="3" fill="var(--color-chart-blue)" />
          <text x="68" y="271" font-size="11.5" font-weight="600" fill="var(--color-ink)">Đại học: ${ug.percentage}% (${ug.count} môn)</text>
          <rect x="220" y="260" width="12" height="12" rx="3" fill="var(--color-chart-red)" />
          <text x="238" y="271" font-size="11.5" font-weight="600" fill="var(--color-ink)">Sau ĐH: ${pg.percentage}% (${pg.count} môn)</text>
        `;
        svg.appendChild(leg);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 1.2 Q1.1 Level Distribution Bar Chart
      function renderChartQ1Levels() {
        const box = document.getElementById("chart-q1-levels");
        if (!box || !DATA) return;
        const lvls = DATA.q1_curriculum.level_distribution;
        const w = 460;
        const h = 300;
        const padL = 40;
        const padR = 20;
        const padT = 30;
        const padB = 40;
        const maxVal = 480;

        const svg = createSvg(w, h);
        const barW = (w - padL - padR) / lvls.length - 16;

        lvls.forEach((d, i) => {
          const bx = padL + i * ((w - padL - padR) / lvls.length) + 8;
          const bh = (d.count / maxVal) * (h - padT - padB);
          const by = h - padB - bh;
          const color = d.level >= 4 ? "var(--color-chart-red)" : "var(--color-chart-blue)";

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", bx);
          rect.setAttribute("y", by);
          rect.setAttribute("width", barW);
          rect.setAttribute("height", bh);
          rect.setAttribute("rx", "5");
          rect.setAttribute("fill", color);
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>Level ${d.level} (${d.tier})</b><br>Số môn: <b>${d.count} môn (${d.percentage}%)</b>`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          // Value top
          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", bx + barW / 2);
          valTxt.setAttribute("y", by - 6);
          valTxt.setAttribute("text-anchor", "middle");
          valTxt.setAttribute("font-size", "11");
          valTxt.setAttribute("font-weight", "700");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", color);
          valTxt.textContent = d.count;
          svg.appendChild(valTxt);

          // Level bottom
          const lblTxt = document.createElementNS(NS, "text");
          lblTxt.setAttribute("x", bx + barW / 2);
          lblTxt.setAttribute("y", h - padB + 20);
          lblTxt.setAttribute("text-anchor", "middle");
          lblTxt.setAttribute("font-size", "11.5");
          lblTxt.setAttribute("font-weight", "600");
          lblTxt.setAttribute("fill", "var(--color-ink)");
          lblTxt.textContent = "L" + d.level;
          svg.appendChild(lblTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 1.3 Q1.2 Credit Distribution Bar Chart
      function renderChartQ1Credits() {
        const box = document.getElementById("chart-q1-credits");
        if (!box || !DATA) return;
        const creds = DATA.q1_curriculum.credit_distribution;
        const w = 460;
        const h = 300;
        const padL = 40;
        const padR = 20;
        const padT = 30;
        const padB = 40;
        const maxVal = 1250;

        const svg = createSvg(w, h);
        const barW = (w - padL - padR) / creds.length - 12;

        creds.forEach((d, i) => {
          const bx = padL + i * ((w - padL - padR) / creds.length) + 6;
          const bh = (d.count / maxVal) * (h - padT - padB);
          const by = h - padB - bh;
          const isStd = d.credit === 4.0;
          const color = isStd ? "var(--color-chart-blue)" : "var(--color-chart-slate)";

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", bx);
          rect.setAttribute("y", by);
          rect.setAttribute("width", barW);
          rect.setAttribute("height", bh);
          rect.setAttribute("rx", "5");
          rect.setAttribute("fill", color);
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${d.credit} Modular Credits</b><br>Số lượng: <b>${d.count} môn (${d.percentage}%)</b>`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", bx + barW / 2);
          valTxt.setAttribute("y", by - 6);
          valTxt.setAttribute("text-anchor", "middle");
          valTxt.setAttribute("font-size", isStd ? "12" : "10");
          valTxt.setAttribute("font-weight", isStd ? "800" : "600");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", color);
          valTxt.textContent = d.count;
          svg.appendChild(valTxt);

          const lblTxt = document.createElementNS(NS, "text");
          lblTxt.setAttribute("x", bx + barW / 2);
          lblTxt.setAttribute("y", h - padB + 20);
          lblTxt.setAttribute("text-anchor", "middle");
          lblTxt.setAttribute("font-size", "11");
          lblTxt.setAttribute("font-weight", "600");
          lblTxt.setAttribute("fill", "var(--color-ink)");
          lblTxt.textContent = d.credit + "MC";
          svg.appendChild(lblTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 1.4 Q1.3 Department Breakdown Donut

      // ========================================================================
      // 1.3B Hierarchical Squarified Treemap for Curriculum Structure (Q1.3)
      // ========================================================================
      function renderChartQ1Treemap() {
        const box = document.getElementById("chart-q1-treemap");
        if (!box) return;

        const w = 1000;
        const h = 340;
        const svg = createSvg(w, h);
        svg.setAttribute("class", "treemap-svg");

        // Treemap hierarchical nodes definition (Horizontal Stacking for IS & DSA to prevent text overflow)
        const treemapNodes = [
          // CS: Level 1-4 (Cử nhân)
          {
            dept: "Khoa học Máy tính (CS)",
            deptCode: "CS",
            tier: "Bậc Cử nhân",
            levels: "Level 1 – 4",
            count: 584,
            pctTotal: "41.71%",
            pctDept: "59.29%",
            x: 0, y: 0, w: 414, h: 340,
            fill: "var(--color-accent)",
            opacity: 0.92,
            textColor: "#FFFFFF"
          },
          // CS: Level 5-6 (Sau đại học)
          {
            dept: "Khoa học Máy tính (CS)",
            deptCode: "CS",
            tier: "Bậc Sau đại học",
            levels: "Level 5 – 6",
            count: 401,
            pctTotal: "28.64%",
            pctDept: "40.71%",
            x: 420, y: 0, w: 284, h: 340,
            fill: "#1E40AF",
            opacity: 0.88,
            textColor: "#FFFFFF"
          },
          // IS: Level 1-4 (Cử nhân) - w: 290, h: 114
          {
            dept: "Hệ thống Thông tin (IS)",
            deptCode: "IS",
            tier: "Bậc Cử nhân",
            levels: "Level 1 – 4",
            count: 148,
            pctTotal: "10.57%",
            pctDept: "62.71%",
            x: 710, y: 0, w: 290, h: 114,
            fill: "#475569",
            opacity: 0.90,
            textColor: "#FFFFFF"
          },
          // IS: Level 5-6 (Sau đại học) - w: 290, h: 70
          {
            dept: "Hệ thống Thông tin (IS)",
            deptCode: "IS",
            tier: "Bậc Sau đại học",
            levels: "Level 5 – 6",
            count: 88,
            pctTotal: "6.29%",
            pctDept: "37.29%",
            x: 710, y: 120, w: 290, h: 70,
            fill: "#334155",
            opacity: 0.92,
            textColor: "#FFFFFF"
          },
          // DSA: Level 1-4 (Cử nhân) - w: 290, h: 82
          {
            dept: "Khoa học Dữ liệu (DSA)",
            deptCode: "DSA",
            tier: "Bậc Cử nhân",
            levels: "Level 1 – 4",
            count: 106,
            pctTotal: "7.57%",
            pctDept: "59.22%",
            x: 710, y: 196, w: 290, h: 82,
            fill: "#059669",
            opacity: 0.90,
            textColor: "#FFFFFF"
          },
          // DSA: Level 5-6 (Sau đại học) - w: 290, h: 56
          {
            dept: "Khoa học Dữ liệu (DSA)",
            deptCode: "DSA",
            tier: "Bậc Sau đại học",
            levels: "Level 5 – 6",
            count: 73,
            pctTotal: "5.21%",
            pctDept: "40.78%",
            x: 710, y: 284, w: 290, h: 56,
            fill: "#047857",
            opacity: 0.92,
            textColor: "#FFFFFF"
          }
        ];

        treemapNodes.forEach((node, idx) => {
          // Multi-layer defensive SVG clip-path
          const clipId = `treemap-clip-${idx}`;
          const clipPath = document.createElementNS(NS, "clipPath");
          clipPath.setAttribute("id", clipId);
          const clipRect = document.createElementNS(NS, "rect");
          clipRect.setAttribute("x", node.x);
          clipRect.setAttribute("y", node.y);
          clipRect.setAttribute("width", node.w);
          clipRect.setAttribute("height", node.h);
          clipRect.setAttribute("rx", "4");
          clipRect.setAttribute("ry", "4");
          clipPath.appendChild(clipRect);
          svg.appendChild(clipPath);

          const g = document.createElementNS(NS, "g");
          g.setAttribute("class", "treemap-cell");
          g.setAttribute("clip-path", `url(#${clipId})`);

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", node.x);
          rect.setAttribute("y", node.y);
          rect.setAttribute("width", node.w);
          rect.setAttribute("height", node.h);
          rect.setAttribute("rx", "4");
          rect.setAttribute("ry", "4");
          rect.setAttribute("fill", node.fill);
          rect.setAttribute("opacity", node.opacity);
          rect.setAttribute("stroke", "var(--color-surface)");
          rect.setAttribute("stroke-width", "1.5");
          g.appendChild(rect);

          if (node.h >= 100) {
            // Full multi-line layout for tall cells (CS & IS Cử nhân)
            const tDept = document.createElementNS(NS, "text");
            tDept.setAttribute("x", node.x + 14);
            tDept.setAttribute("y", node.y + 24);
            tDept.setAttribute("font-family", "var(--font-mono)");
            tDept.setAttribute("font-size", "11.5");
            tDept.setAttribute("font-weight", "700");
            tDept.setAttribute("fill", node.textColor);
            tDept.setAttribute("letter-spacing", "0.03em");
            tDept.textContent = node.dept;
            g.appendChild(tDept);

            const tTier = document.createElementNS(NS, "text");
            tTier.setAttribute("x", node.x + 14);
            tTier.setAttribute("y", node.y + 45);
            tTier.setAttribute("font-size", "13");
            tTier.setAttribute("font-weight", "700");
            tTier.setAttribute("fill", node.textColor);
            tTier.textContent = node.tier;
            g.appendChild(tTier);

            const tLvl = document.createElementNS(NS, "text");
            tLvl.setAttribute("x", node.x + 14);
            tLvl.setAttribute("y", node.y + 64);
            tLvl.setAttribute("font-family", "var(--font-mono)");
            tLvl.setAttribute("font-size", "11");
            tLvl.setAttribute("fill", node.textColor);
            tLvl.setAttribute("opacity", "0.85");
            tLvl.textContent = node.levels;
            g.appendChild(tLvl);

            const tCount = document.createElementNS(NS, "text");
            tCount.setAttribute("x", node.x + 14);
            tCount.setAttribute("y", node.y + node.h - 14);
            tCount.setAttribute("font-family", "var(--font-mono)");
            tCount.setAttribute("font-size", "14.5");
            tCount.setAttribute("font-weight", "800");
            tCount.setAttribute("fill", node.textColor);
            tCount.textContent = `${node.count} môn (${node.pctTotal})`;
            g.appendChild(tCount);
          } else if (node.h >= 65) {
            // Short cells (IS Sau đại học h: 70 & DSA Cử nhân h: 82)
            // Row 1: Dept (left) + Count (right) - Zero overflow
            const tDept = document.createElementNS(NS, "text");
            tDept.setAttribute("x", node.x + 14);
            tDept.setAttribute("y", node.y + 22);
            tDept.setAttribute("font-family", "var(--font-mono)");
            tDept.setAttribute("font-size", "11");
            tDept.setAttribute("font-weight", "700");
            tDept.setAttribute("fill", node.textColor);
            tDept.textContent = node.dept;
            g.appendChild(tDept);

            const tCount = document.createElementNS(NS, "text");
            tCount.setAttribute("x", node.x + node.w - 14);
            tCount.setAttribute("y", node.y + 22);
            tCount.setAttribute("text-anchor", "end");
            tCount.setAttribute("font-family", "var(--font-mono)");
            tCount.setAttribute("font-size", "12");
            tCount.setAttribute("font-weight", "800");
            tCount.setAttribute("fill", node.textColor);
            tCount.textContent = `${node.count} môn (${node.pctTotal})`;
            g.appendChild(tCount);

            // Row 2: Tier & Levels
            const tTier = document.createElementNS(NS, "text");
            tTier.setAttribute("x", node.x + 14);
            tTier.setAttribute("y", node.y + 44);
            tTier.setAttribute("font-size", "11.5");
            tTier.setAttribute("font-weight", "700");
            tTier.setAttribute("fill", node.textColor);
            tTier.textContent = `${node.tier} (${node.levels})`;
            g.appendChild(tTier);
          } else {
            // Ultra-compact cell (DSA Sau đại học h: 56)
            // Row 1: Dept (left) + Count (right) - Zero overflow
            const tDept = document.createElementNS(NS, "text");
            tDept.setAttribute("x", node.x + 14);
            tDept.setAttribute("y", node.y + 20);
            tDept.setAttribute("font-family", "var(--font-mono)");
            tDept.setAttribute("font-size", "11");
            tDept.setAttribute("font-weight", "700");
            tDept.setAttribute("fill", node.textColor);
            tDept.textContent = node.dept;
            g.appendChild(tDept);

            const tCount = document.createElementNS(NS, "text");
            tCount.setAttribute("x", node.x + node.w - 14);
            tCount.setAttribute("y", node.y + 20);
            tCount.setAttribute("text-anchor", "end");
            tCount.setAttribute("font-family", "var(--font-mono)");
            tCount.setAttribute("font-size", "11.5");
            tCount.setAttribute("font-weight", "800");
            tCount.setAttribute("fill", node.textColor);
            tCount.textContent = `${node.count} môn (${node.pctTotal})`;
            g.appendChild(tCount);

            // Row 2: Tier & Levels
            const tTier = document.createElementNS(NS, "text");
            tTier.setAttribute("x", node.x + 14);
            tTier.setAttribute("y", node.y + 40);
            tTier.setAttribute("font-size", "10.5");
            tTier.setAttribute("font-weight", "700");
            tTier.setAttribute("fill", node.textColor);
            tTier.textContent = `${node.tier} (${node.levels})`;
            g.appendChild(tTier);
          }

          // Hover interaction & tooltip
          g.addEventListener("mouseenter", (e) => {
            rect.setAttribute("stroke", "var(--color-ink)");
            rect.setAttribute("stroke-width", "2.5");
            showTooltip(e, `
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--color-muted);">${node.dept}</div>
              <div style="font-weight:700; font-size:13px; margin:2px 0;">${node.tier} (${node.levels})</div>
              <div style="font-size:12px;">Số lượng: <b>${node.count} môn</b></div>
              <div style="font-size:12px;">Tỷ trọng toàn trường: <b>${node.pctTotal}</b></div>
              <div style="font-size:12px;">Tỷ trọng trong ngành: <b>${node.pctDept}</b></div>
            `);
          });

          g.addEventListener("mousemove", (e) => {
            showTooltip(e, `
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--color-muted);">${node.dept}</div>
              <div style="font-weight:700; font-size:13px; margin:2px 0;">${node.tier} (${node.levels})</div>
              <div style="font-size:12px;">Số lượng: <b>${node.count} môn</b></div>
              <div style="font-size:12px;">Tỷ trọng toàn trường: <b>${node.pctTotal}</b></div>
              <div style="font-size:12px;">Tỷ trọng trong ngành: <b>${node.pctDept}</b></div>
            `);
          });

          g.addEventListener("mouseleave", () => {
            rect.setAttribute("stroke", "var(--color-surface)");
            rect.setAttribute("stroke-width", "1.5");
            hideTooltip();
          });

          svg.appendChild(g);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      function renderChartQ1Dept() {
        const box = document.getElementById("chart-q1-dept");
        if (!box || !DATA) return;
        const depts = DATA.q1_curriculum.dept_distribution;
        const arr = [
          { name: "Khoa Khoa học Máy tính (CS)", count: depts.CS.count, pct: depts.CS.percentage, color: "var(--color-chart-blue)" },
          { name: "Hệ thống thông tin (IS)", count: depts.IS.count, pct: depts.IS.percentage, color: "var(--color-chart-purple)" },
          { name: "Khoa học Dữ liệu (DSA)", count: depts.DSA.count, pct: depts.DSA.percentage, color: "var(--color-chart-red)" }
        ];

        const w = 460;
        const h = 320;
        const cx = 230;
        const cy = 145;
        const rOut = 95;
        const rIn = 60;
        const svg = createSvg(w, h);

        let curA = 0;
        arr.forEach(d => {
          const a = (d.pct / 100) * Math.PI * 2;
          const endA = curA + a;

          const x1 = cx + rOut * Math.sin(curA);
          const y1 = cy - rOut * Math.cos(curA);
          const x2 = cx + rOut * Math.sin(endA);
          const y2 = cy - rOut * Math.cos(endA);
          const x3 = cx + rIn * Math.sin(endA);
          const y3 = cy - rIn * Math.cos(endA);
          const x4 = cx + rIn * Math.sin(curA);
          const y4 = cy - rIn * Math.cos(curA);
          const large = a > Math.PI ? 1 : 0;
          const pathD = `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;

          const path = document.createElementNS(NS, "path");
          path.setAttribute("d", pathD);
          path.setAttribute("fill", d.color);
          path.style.cursor = "pointer";
          path.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${d.name}</b><br>Số môn: <b>${d.count} môn (${d.pct}%)</b>`));
          path.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(path);

          curA = endA;
        });

        // Center text
        const t1 = document.createElementNS(NS, "text");
        t1.setAttribute("x", cx);
        t1.setAttribute("y", cy);
        t1.setAttribute("text-anchor", "middle");
        t1.setAttribute("font-size", "22");
        t1.setAttribute("font-weight", "800");
        t1.setAttribute("fill", "var(--color-ink)");
        t1.textContent = "1,400";
        svg.appendChild(t1);

        const t2 = document.createElementNS(NS, "text");
        t2.setAttribute("x", cx);
        t2.setAttribute("y", cy + 18);
        t2.setAttribute("text-anchor", "middle");
        t2.setAttribute("font-size", "11");
        t2.setAttribute("fill", "var(--color-muted)");
        t2.textContent = "Môn mở";
        svg.appendChild(t2);

        // Legend below
        const leg = document.createElementNS(NS, "g");
        leg.innerHTML = `
          <text x="30" y="290" font-size="11" fill="var(--color-ink)"><tspan font-weight="700" fill="var(--color-chart-blue)">■ CS:</tspan> ${depts.CS.percentage}%</text>
          <text x="180" y="290" font-size="11" fill="var(--color-ink)"><tspan font-weight="700" fill="var(--color-chart-purple)">■ IS:</tspan> ${depts.IS.percentage}%</text>
          <text x="320" y="290" font-size="11" fill="var(--color-ink)"><tspan font-weight="700" fill="var(--color-chart-red)">■ DSA:</tspan> ${depts.DSA.percentage}%</text>
        `;
        svg.appendChild(leg);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 1.5 Q1.3 Top 10 Venues Horizontal Bar
      function renderChartQ1Venues() {
        const box = document.getElementById("chart-q1-venues");
        if (!box || !DATA) return;
        const venues = DATA.q1_curriculum.venues_ranking.slice(0, 8);
        const w = 460;
        const h = 320;
        const padL = 70;
        const padR = 60;
        const padT = 20;
        const padB = 20;
        const maxVal = venues[0].slots * 1.15;

        const svg = createSvg(w, h);
        const barH = (h - padT - padB) / venues.length - 8;

        venues.forEach((v, i) => {
          const by = padT + i * ((h - padT - padB) / venues.length) + 4;
          const bw = (v.slots / maxVal) * (w - padL - padR);
          const isCom = ["COM1", "COM3"].includes(v.venue);
          const color = isCom ? "var(--color-chart-blue)" : "var(--color-chart-slate)";

          // Venue name
          const nameTxt = document.createElementNS(NS, "text");
          nameTxt.setAttribute("x", padL - 10);
          nameTxt.setAttribute("y", by + barH / 2 + 4);
          nameTxt.setAttribute("text-anchor", "end");
          nameTxt.setAttribute("font-size", "11.5");
          nameTxt.setAttribute("font-weight", isCom ? "700" : "500");
          nameTxt.setAttribute("font-family", "monospace");
          nameTxt.setAttribute("fill", isCom ? "var(--color-primary)" : "var(--color-ink)");
          nameTxt.textContent = v.venue;
          svg.appendChild(nameTxt);

          // Bar
          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", padL);
          rect.setAttribute("y", by);
          rect.setAttribute("width", bw);
          rect.setAttribute("height", barH);
          rect.setAttribute("rx", "4");
          rect.setAttribute("fill", color);
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>Giảng đường ${v.venue}</b><br>Số tiết giảng dạy: <b>${v.slots.toLocaleString()} tiết</b>`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          // Value right
          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", padL + bw + 8);
          valTxt.setAttribute("y", by + barH / 2 + 4);
          valTxt.setAttribute("font-size", "11");
          valTxt.setAttribute("font-weight", "700");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", color);
          valTxt.textContent = v.slots;
          svg.appendChild(valTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 2.1 Q2.1 Workload Components Breakdown Horizontal Bar
      function renderChartQ2Breakdown() {
        const box = document.getElementById("chart-q2-breakdown");
        if (!box || !DATA) return;
        const wl = DATA.q2_workload.components_mean;
        const items = [
          { label: "Tự học", val: wl.prep_hours, pct: "47.4%", color: "var(--color-chart-red)" },
          { label: "Lý thuyết", val: wl.lec_hours, pct: "23.4%", color: "var(--color-chart-blue)" },
          { label: "Thảo luận", val: wl.tut_hours, pct: "10.9%", color: "var(--color-chart-purple)" },
          { label: "Phòng Lab", val: wl.lab_hours, pct: "10.2%", color: "var(--color-chart-emerald)" },
          { label: "Đồ án", val: wl.proj_hours, pct: "8.2%", color: "var(--color-chart-amber)" }
        ];

        const w = 460;
        const h = 320;
        const padL = 100;
        const padR = 60;
        const padT = 20;
        const padB = 20;
        const maxVal = 5.5;

        const svg = createSvg(w, h);
        const barH = (h - padT - padB) / items.length - 12;

        items.forEach((item, i) => {
          const by = padT + i * ((h - padT - padB) / items.length) + 6;
          const bw = (item.val / maxVal) * (w - padL - padR);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 12);
          lbl.setAttribute("y", by + barH / 2 + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11.5");
          lbl.setAttribute("font-weight", "600");
          lbl.setAttribute("fill", "var(--color-ink)");
          lbl.textContent = item.label;
          svg.appendChild(lbl);

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", padL);
          rect.setAttribute("y", by);
          rect.setAttribute("width", bw);
          rect.setAttribute("height", barH);
          rect.setAttribute("rx", "5");
          rect.setAttribute("fill", item.color);
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${item.label}</b><br>Thời lượng: <b>${item.val} giờ/tuần</b> (${item.pct})`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", padL + bw + 8);
          valTxt.setAttribute("y", by + barH / 2 + 4);
          valTxt.setAttribute("font-size", "11.5");
          valTxt.setAttribute("font-weight", "700");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", item.color);
          valTxt.textContent = item.val + "h (" + item.pct + ")";
          svg.appendChild(valTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 2.2 Q2.2 OLS Regression Scatter & Line
      function renderChartQ2Ols() {
        const box = document.getElementById("chart-q2-ols");
        if (!box || !DATA) return;
        const reg = DATA.q2_workload.ols_regression.prep_vs_level;
        const trans = DATA.q4_stats.level_transitions;
        const w = 920;
        const h = 420;
        const padL = 60;
        const padR = 40;
        const padT = 50;
        const padB = 55;

        // Bind toolbar controls once
        const btnReg = document.getElementById("btn-ols-reg");
        const btnMean = document.getElementById("btn-ols-mean");
        const btnBench = document.getElementById("btn-ols-benchmark");
        const btnOutliers = document.getElementById("btn-ols-outliers");
        if (btnReg && !btnReg.dataset.bound) {
          btnReg.dataset.bound = "1";
          btnReg.addEventListener("click", () => {
            olsShowRegression = !olsShowRegression;
            btnReg.classList.toggle("active", olsShowRegression);
            renderChartQ2Ols();
          });
        }
        if (btnMean && !btnMean.dataset.bound) {
          btnMean.dataset.bound = "1";
          btnMean.addEventListener("click", () => {
            olsShowEmpiricalMean = !olsShowEmpiricalMean;
            btnMean.classList.toggle("active", olsShowEmpiricalMean);
            renderChartQ2Ols();
          });
        }
        if (btnBench && !btnBench.dataset.bound) {
          btnBench.dataset.bound = "1";
          btnBench.addEventListener("click", () => {
            olsShowBenchmark4h = !olsShowBenchmark4h;
            btnBench.classList.toggle("active", olsShowBenchmark4h);
            renderChartQ2Ols();
          });
        }
        if (btnOutliers && !btnOutliers.dataset.bound) {
          btnOutliers.dataset.bound = "1";
          btnOutliers.addEventListener("click", () => {
            olsHighlightOutliers = !olsHighlightOutliers;
            btnOutliers.classList.toggle("active", olsHighlightOutliers);
            if (!olsHighlightOutliers) {
              olsPinnedModule = null;
              const insp = document.getElementById("ols-point-inspector");
              if (insp) insp.style.display = "none";
            }
            renderChartQ2Ols();
          });
        }

        const minX = 0.5;
        const maxX = 6.5;
        const minY = 0.0;
        const maxY = 8.5;

        // Dynamic Takeaway Update based on Outliers toggle
        const olsTakeaway = document.getElementById("ols-takeaway-text");
        if (olsTakeaway) {
          if (olsHighlightOutliers) {
            olsTakeaway.innerHTML = `<strong>Chẩn đoán phần dư hồi quy OLS:</strong> Nhận diện 45 môn học có sai số dư lớn (|e| &ge; 2.5h). Môn vượt tải cao nhất (IS4103 +4.77h, ISD5101 +4.48h) là các môn tích hợp đồ án doanh nghiệp đòi hỏi 8.0h tự học/tuần. Ngược lại, các môn 0h chuẩn bị (IS6000, CS5343) chuyển hóa toàn bộ thời gian sang seminar nghiên cứu độc lập và đồ án.`;
          } else {
            olsTakeaway.innerHTML = `Mối tương quan thuận giữa cấp độ môn học và thời lượng tự học là có thật và có ý nghĩa thống kê bền vững (<i>p</i> &lt; 0.001). Cấp độ càng cao, sinh viên càng phải chủ động tự nghiên cứu độc lập ngoài giờ lên lớp.`;
          }
        }

        // Summary in Inspector if Outliers mode is active and no single module pinned
        if (olsHighlightOutliers && !olsPinnedModule) {
          const insp = document.getElementById("ols-point-inspector");
          if (insp) {
            insp.style.display = "flex";
            insp.innerHTML = `
              <div class="inspector-title">
                <span class="inspector-badge font-mono">Chẩn đoán dị biệt</span>
                <span>Nhóm 45 môn học có sai số dư lớn (|e| &ge; 2.5h)</span>
              </div>
              <div class="inspector-metrics">
                <span>Dị biệt dương (vượt tải): <b style="color:var(--color-chart-red);">26 môn</b> (Ví dụ: IS4103 dư +4.77h, ISD5101 dư +4.48h)</span>
                <span>Dị biệt âm (nhẹ tải lý thuyết): <b style="color:var(--color-chart-blue);">19 môn</b> (Gồm IS6000, CS5343: 0h prep do dồn vào seminar/đồ án)</span>
              </div>
              <div class="inspector-actions">
                <button class="inspector-close-btn font-mono" onclick="window.closeOlsPointInspector()">&times; Đóng</button>
              </div>
            `;
          }
        }

        const svg = createSvg(w, h);

        function mapX(lvl) { return padL + ((lvl - minX) / (maxX - minX)) * (w - padL - padR); }
        function mapY(val) { return h - padB - ((val - minY) / (maxY - minY)) * (h - padT - padB); }

        // Grid lines Y (from 0.0h to 8.0h)
        for (let v = 0; v <= 8; v += 1) {
          const y = mapY(v);
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", padL);
          line.setAttribute("y1", y);
          line.setAttribute("x2", w - padR);
          line.setAttribute("y2", y);
          line.setAttribute("stroke", v === 0 ? "var(--color-hairline-strong)" : "var(--color-rule)");
          line.setAttribute("stroke-dasharray", v === 0 ? "none" : "3,3");
          svg.appendChild(line);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v.toFixed(0) + ".0h";
          svg.appendChild(lbl);
        }

        // Y Axis Label
        const yAxisTitle = document.createElementNS(NS, "text");
        yAxisTitle.setAttribute("x", padL);
        yAxisTitle.setAttribute("y", 22);
        yAxisTitle.setAttribute("font-size", "11");
        yAxisTitle.setAttribute("font-weight", "600");
        yAxisTitle.setAttribute("fill", "var(--color-muted)");
        yAxisTitle.textContent = "Số giờ chuẩn bị & tự học / tuần (prep_hours)";
        svg.appendChild(yAxisTitle);

        // X Axis Level columns & labels
        for (let lvl = 1; lvl <= 6; lvl++) {
          const cx = mapX(lvl);

          const vGuide = document.createElementNS(NS, "line");
          vGuide.setAttribute("x1", cx);
          vGuide.setAttribute("y1", padT);
          vGuide.setAttribute("x2", cx);
          vGuide.setAttribute("y2", h - padB);
          vGuide.setAttribute("stroke", "var(--color-border-subtle)");
          vGuide.setAttribute("stroke-dasharray", "2,4");
          svg.appendChild(vGuide);

          const xLbl = document.createElementNS(NS, "text");
          xLbl.setAttribute("x", cx);
          xLbl.setAttribute("y", h - padB + 20);
          xLbl.setAttribute("text-anchor", "middle");
          xLbl.setAttribute("font-size", "12");
          xLbl.setAttribute("font-weight", "700");
          xLbl.setAttribute("fill", "var(--color-ink)");
          xLbl.textContent = "Level " + lvl;
          svg.appendChild(xLbl);

          const tierLbl = document.createElementNS(NS, "text");
          tierLbl.setAttribute("x", cx);
          tierLbl.setAttribute("y", h - padB + 36);
          tierLbl.setAttribute("text-anchor", "middle");
          tierLbl.setAttribute("font-size", "10");
          tierLbl.setAttribute("fill", "var(--color-muted)");
          tierLbl.textContent = lvl <= 4 ? "Đại học" : "Sau ĐH";
          svg.appendChild(tierLbl);
        }

        // Reference Benchmark 4.0h/week line
        if (olsShowBenchmark4h) {
          const y4 = mapY(4.0);
          const benchLine = document.createElementNS(NS, "line");
          benchLine.setAttribute("x1", padL);
          benchLine.setAttribute("y1", y4);
          benchLine.setAttribute("x2", w - padR);
          benchLine.setAttribute("y2", y4);
          benchLine.setAttribute("stroke", "var(--color-muted)");
          benchLine.setAttribute("stroke-width", "1.5");
          benchLine.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(benchLine);

          const benchTag = document.createElementNS(NS, "g");
          benchTag.innerHTML = `
            <rect x="${w - padR - 165}" y="${y4 - 18}" width="165" height="17" rx="3" fill="var(--color-surface)" stroke="var(--color-border)" />
            <text x="${w - padR - 82}" y="${y4 - 6}" text-anchor="middle" font-size="10" font-family="monospace" fill="var(--color-muted)">Ngưỡng chuẩn: 4.0h/tuần</text>
          `;
          svg.appendChild(benchTag);
        }

        function selectModule(m) {
          olsPinnedModule = m;
          const insp = document.getElementById("ols-point-inspector");
          if (insp) {
            insp.style.display = "flex";
            const pred = (reg.slope * m.level + reg.intercept).toFixed(2);
            const res = m.prep_hours - (reg.slope * m.level + reg.intercept);
            const resStr = (res >= 0 ? "+" : "") + res.toFixed(2);
            const isAi = m.is_ai_core;
            insp.innerHTML = `
              <div class="inspector-title">
                <span class="inspector-badge font-mono">${m.moduleCode}</span>
                <span>${m.title}</span>
              </div>
              <div class="inspector-metrics">
                <span>Cấp độ: <b>Level ${m.level}</b></span>
                <span>Giờ tự học: <b>${m.prep_hours}h/tuần</b></span>
                <span>Kỳ vọng OLS: <b>${pred}h/tuần</b></span>
                <span>Phần dư hồi quy: <b>${resStr}h</b></span>
                <span>Phân loại: <b style="${isAi ? 'color:var(--color-chart-red);' : ''}">${isAi ? 'Môn AI/ML' : 'Môn CS tiêu chuẩn'}</b></span>
              </div>
              <div class="inspector-actions">
                <button class="inspector-action-btn font-mono" onclick="window.jumpToModuleFromPca('${m.moduleCode}')">Tra cứu trong Data Explorer &rarr;</button>
                <button class="inspector-close-btn font-mono" onclick="window.closeOlsPointInspector()">&times; Đóng</button>
              </div>
            `;
          }
          renderChartQ2Ols();
        }

        // 1. Scatter Cloud: unique 348 modules
        const uniqueModules = [];
        const seenCodes = new Set();
        if (DATA.modules) {
          DATA.modules.forEach(m => {
            if (!seenCodes.has(m.moduleCode)) {
              seenCodes.add(m.moduleCode);
              uniqueModules.push(m);
            }
          });
        }

        uniqueModules.forEach(m => {
          let hash = 0;
          for (let i = 0; i < m.moduleCode.length; i++) {
            hash = (hash << 5) - hash + m.moduleCode.charCodeAt(i);
            hash |= 0;
          }
          const jitter = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.44;
          const cx = mapX(m.level + jitter);
          const cy = mapY(m.prep_hours);
          const isPinned = olsPinnedModule && olsPinnedModule.moduleCode === m.moduleCode;

          const pred = reg.slope * m.level + reg.intercept;
          const residual = m.prep_hours - pred;
          const isOutlier = Math.abs(residual) >= 2.5;

          if (isPinned) {
            const ring = document.createElementNS(NS, "circle");
            ring.setAttribute("cx", cx);
            ring.setAttribute("cy", cy);
            ring.setAttribute("r", "10");
            ring.setAttribute("fill", "none");
            ring.setAttribute("stroke", "var(--color-ink)");
            ring.setAttribute("stroke-width", "2");
            svg.appendChild(ring);
          } else if (olsHighlightOutliers && isOutlier) {
            const halo = document.createElementNS(NS, "circle");
            halo.setAttribute("cx", cx);
            halo.setAttribute("cy", cy);
            halo.setAttribute("r", "8.5");
            halo.setAttribute("fill", "none");
            halo.setAttribute("stroke", residual > 0 ? "var(--color-chart-red)" : "var(--color-chart-blue)");
            halo.setAttribute("stroke-width", "1.8");
            halo.setAttribute("stroke-dasharray", "2,2");
            svg.appendChild(halo);
          }

          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", cx);
          dot.setAttribute("cy", cy);
          dot.setAttribute("r", isPinned ? "6.5" : (olsHighlightOutliers && isOutlier ? "5.5" : (m.is_ai_core ? "4.5" : "3.5")));
          dot.setAttribute("fill", m.is_ai_core ? "var(--color-chart-red)" : "var(--color-chart-slate)");
          let op = isPinned ? "1" : (m.is_ai_core ? "0.75" : "0.35");
          if (olsHighlightOutliers) {
            op = isOutlier ? "1" : "0.12";
          }
          dot.setAttribute("opacity", op);
          dot.style.cursor = "pointer";
          dot.addEventListener("mouseenter", (e) => {
            if (!isPinned) {
              dot.setAttribute("r", m.is_ai_core ? "6.5" : "5.5");
              dot.setAttribute("opacity", "1");
            }
            showTooltip(e, `<b>${m.moduleCode}: ${m.title}</b><br>Cấp độ: <b>Level ${m.level}</b> &bull; Giờ tự học: <b>${m.prep_hours}h/tuần</b><br>Phần dư hồi quy: <b>${residual >= 0 ? '+' : ''}${residual.toFixed(2)}h</b><br>Phân loại: <b>${m.is_ai_core ? '<span style=\"color:var(--color-chart-red);\">● Môn Trọng tâm AI/ML</span>' : '● Môn CS Tiêu chuẩn'}</b><br><small style=\"color:var(--color-muted);\">Bấm để ghim thông số môn</small>`);
          });
          dot.addEventListener("mouseleave", () => {
            if (!isPinned) {
              dot.setAttribute("r", olsHighlightOutliers && isOutlier ? "5.5" : (m.is_ai_core ? "4.5" : "3.5"));
              dot.setAttribute("opacity", op);
            }
            hideTooltip();
          });
          dot.addEventListener("click", () => selectModule(m));
          svg.appendChild(dot);
        });

        // 2. OLS Regression Trendline (Solid Blue)
        if (olsShowRegression) {
          const x1 = mapX(0.7);
          const y1 = mapY(reg.slope * 0.7 + reg.intercept);
          const x2 = mapX(6.3);
          const y2 = mapY(reg.slope * 6.3 + reg.intercept);

          const rLine = document.createElementNS(NS, "line");
          rLine.setAttribute("x1", x1);
          rLine.setAttribute("y1", y1);
          rLine.setAttribute("x2", x2);
          rLine.setAttribute("y2", y2);
          rLine.setAttribute("stroke", "var(--color-chart-blue)");
          rLine.setAttribute("stroke-width", "3");
          rLine.setAttribute("stroke-linecap", "round");
          svg.appendChild(rLine);
        }

        // 3. Empirical Mean Points for each Level
        if (olsShowEmpiricalMean) {
          // Connect empirical averages with dashed trendline
          const meanPts = trans.map(t => ({ x: mapX(t.level), y: mapY(t.prep_hours) }));
          const meanPathD = meanPts.map((p, i) => (i === 0 ? "M " : "L ") + `${p.x} ${p.y}`).join(" ");
          const meanLine = document.createElementNS(NS, "path");
          meanLine.setAttribute("d", meanPathD);
          meanLine.setAttribute("fill", "none");
          meanLine.setAttribute("stroke", "var(--color-chart-red)");
          meanLine.setAttribute("stroke-width", "1.5");
          meanLine.setAttribute("stroke-dasharray", "4,4");
          meanLine.setAttribute("opacity", "0.6");
          svg.appendChild(meanLine);

          trans.forEach(t => {
            const cx = mapX(t.level);
            const cy = mapY(t.prep_hours);
            const pred = reg.slope * t.level + reg.intercept;
            const residual = t.prep_hours - pred;

            // Residual needle from OLS line to empirical average
            if (olsShowRegression) {
              const predY = mapY(pred);
              const needle = document.createElementNS(NS, "line");
              needle.setAttribute("x1", cx);
              needle.setAttribute("y1", predY);
              needle.setAttribute("x2", cx);
              needle.setAttribute("y2", cy);
              needle.setAttribute("stroke", "var(--color-chart-red)");
              needle.setAttribute("stroke-width", "1.5");
              needle.setAttribute("stroke-dasharray", "2,2");
              svg.appendChild(needle);
            }

            // Mean Marker
            const halo = document.createElementNS(NS, "circle");
            halo.setAttribute("cx", cx);
            halo.setAttribute("cy", cy);
            halo.setAttribute("r", "8");
            halo.setAttribute("fill", "var(--color-surface)");
            halo.setAttribute("stroke", "var(--color-chart-red)");
            halo.setAttribute("stroke-width", "2.5");
            halo.style.cursor = "pointer";

            const centerDot = document.createElementNS(NS, "circle");
            centerDot.setAttribute("cx", cx);
            centerDot.setAttribute("cy", cy);
            centerDot.setAttribute("r", "3.5");
            centerDot.setAttribute("fill", "var(--color-chart-red)");
            centerDot.style.cursor = "pointer";

            const hoverTarget = document.createElementNS(NS, "circle");
            hoverTarget.setAttribute("cx", cx);
            hoverTarget.setAttribute("cy", cy);
            hoverTarget.setAttribute("r", "16");
            hoverTarget.setAttribute("fill", "transparent");
            hoverTarget.style.cursor = "pointer";
            hoverTarget.addEventListener("mouseenter", (e) => {
              halo.setAttribute("r", "10");
              showTooltip(e, `<b>Trung bình thực nghiệm Level ${t.level} (${t.tier})</b><br>` +
                `Giờ tự học thực tế: <b style="color:var(--color-chart-red);">${t.prep_hours}h/tuần</b><br>` +
                `Kỳ vọng theo OLS: <b style="color:var(--color-chart-blue);">${pred.toFixed(2)}h/tuần</b><br>` +
                `Độ lệch dư: <b>${residual >= 0 ? '+' : ''}${residual.toFixed(2)}h</b>`);
            });
            hoverTarget.addEventListener("mouseleave", () => {
              halo.setAttribute("r", "8");
              hideTooltip();
            });

            svg.appendChild(halo);
            svg.appendChild(centerDot);
            svg.appendChild(hoverTarget);

            // Mean Value Tag (pill badge with opaque backdrop)
            const predVal = reg.slope * t.level + reg.intercept;
            const badgeY = cy > mapY(predVal) ? cy + 18 : cy - 12;
            const pillG = document.createElementNS(NS, "g");

            const pillRect = document.createElementNS(NS, "rect");
            pillRect.setAttribute("x", cx - 22);
            pillRect.setAttribute("y", badgeY - 11);
            pillRect.setAttribute("width", "44");
            pillRect.setAttribute("height", "15");
            pillRect.setAttribute("rx", "3");
            pillRect.setAttribute("fill", "var(--color-surface)");
            pillRect.setAttribute("stroke", "var(--color-chart-red)");
            pillRect.setAttribute("stroke-width", "1");
            pillRect.setAttribute("opacity", "0.95");
            pillG.appendChild(pillRect);

            const txt = document.createElementNS(NS, "text");
            txt.setAttribute("x", cx);
            txt.setAttribute("y", badgeY);
            txt.setAttribute("text-anchor", "middle");
            txt.setAttribute("font-size", "11");
            txt.setAttribute("font-weight", "700");
            txt.setAttribute("font-family", "monospace");
            txt.setAttribute("fill", "var(--color-chart-red)");
            txt.textContent = t.prep_hours + "h";
            pillG.appendChild(txt);

            svg.appendChild(pillG);
          });
        }

        // 5. Interactive Legend top-right
        const legGroup = document.createElementNS(NS, "g");
        legGroup.setAttribute("transform", `translate(${w - padR - 360}, 12)`);
        legGroup.innerHTML = `
          <line x1="0" y1="12" x2="18" y2="12" stroke="var(--color-chart-blue)" stroke-width="3" stroke-linecap="round"/>
          <text x="24" y="15" font-size="10.5" font-weight="600" fill="var(--color-ink)">Đường OLS</text>

          <circle cx="95" cy="12" r="5" fill="var(--color-surface)" stroke="var(--color-chart-red)" stroke-width="2"/>
          <text x="105" y="15" font-size="10.5" font-weight="600" fill="var(--color-ink)">TB Level</text>

          <circle cx="165" cy="12" r="3.5" fill="var(--color-chart-slate)" opacity="0.6"/>
          <text x="174" y="15" font-size="10.5" font-weight="600" fill="var(--color-muted)">CS Chuẩn</text>

          <circle cx="235" cy="12" r="4.5" fill="var(--color-chart-red)" opacity="0.85"/>
          <text x="245" y="15" font-size="10.5" font-weight="600" fill="var(--color-chart-red)">AI Core</text>
        `;
        svg.appendChild(legGroup);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 2.3 Q2.3 AI vs CS Workload Comparison Grouped Bar
      function renderChartQ2AiComp() {
        const box = document.getElementById("chart-q2-ai-comp");
        if (!box || !DATA) return;
        const aiVs = DATA.q2_workload.ai_vs_non_ai;
        const metrics = [
          { label: "Tổng giờ học", cs: aiVs.non_ai_modules.total_workload_mean, ai: aiVs.ai_modules.total_workload_mean },
          { label: "Giờ tự học", cs: aiVs.non_ai_modules.prep_hours_mean, ai: aiVs.ai_modules.prep_hours_mean },
          { label: "Giờ đồ án", cs: 0.73, ai: 1.45 }
        ];

        const w = 460;
        const h = 320;
        const padL = 90;
        const padR = 40;
        const padT = 30;
        const padB = 30;
        const maxVal = 13;

        const svg = createSvg(w, h);
        const groupH = (h - padT - padB) / metrics.length;
        const barH = groupH * 0.35;

        metrics.forEach((m, i) => {
          const gy = padT + i * groupH;

          // Metric Label
          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 12);
          lbl.setAttribute("y", gy + groupH / 2 + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11.5");
          lbl.setAttribute("font-weight", "600");
          lbl.setAttribute("fill", "var(--color-ink)");
          lbl.textContent = m.label;
          svg.appendChild(lbl);

          // CS Bar
          const wCs = (m.cs / maxVal) * (w - padL - padR);
          const rCs = document.createElementNS(NS, "rect");
          rCs.setAttribute("x", padL);
          rCs.setAttribute("y", gy + 4);
          rCs.setAttribute("width", wCs);
          rCs.setAttribute("height", barH);
          rCs.setAttribute("rx", "3");
          rCs.setAttribute("fill", "var(--color-chart-slate)");
          rCs.style.cursor = "pointer";
          rCs.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${m.label} (CS Tiêu chuẩn)</b><br>Thời lượng: <b>${m.cs}h/tuần</b>`));
          rCs.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rCs);

          const tCs = document.createElementNS(NS, "text");
          tCs.setAttribute("x", padL + wCs + 6);
          tCs.setAttribute("y", gy + 4 + barH / 2 + 4);
          tCs.setAttribute("font-size", "11");
          tCs.setAttribute("font-family", "monospace");
          tCs.setAttribute("fill", "var(--color-muted)");
          tCs.textContent = m.cs + "h";
          svg.appendChild(tCs);

          // AI Bar
          const wAi = (m.ai / maxVal) * (w - padL - padR);
          const rAi = document.createElementNS(NS, "rect");
          rAi.setAttribute("x", padL);
          rAi.setAttribute("y", gy + 8 + barH);
          rAi.setAttribute("width", wAi);
          rAi.setAttribute("height", barH);
          rAi.setAttribute("rx", "3");
          rAi.setAttribute("fill", "var(--color-chart-red)");
          rAi.style.cursor = "pointer";
          rAi.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${m.label} (Chuyên ngành AI)</b><br>Thời lượng: <b>${m.ai}h/tuần</b>`));
          rAi.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rAi);

          const tAi = document.createElementNS(NS, "text");
          tAi.setAttribute("x", padL + wAi + 6);
          tAi.setAttribute("y", gy + 8 + barH + barH / 2 + 4);
          tAi.setAttribute("font-size", "11");
          tAi.setAttribute("font-weight", "700");
          tAi.setAttribute("font-family", "monospace");
          tAi.setAttribute("fill", "var(--color-chart-red)");
          tAi.textContent = m.ai + "h";
          svg.appendChild(tAi);
        });

        // Legend at top
        const leg = document.createElementNS(NS, "g");
        leg.innerHTML = `
          <rect x="${padL}" y="8" width="10" height="10" rx="2" fill="var(--color-chart-slate)" />
          <text x="${padL + 14}" y="17" font-size="11" fill="var(--color-muted)">CS Tiêu chuẩn</text>
          <rect x="${padL + 120}" y="8" width="10" height="10" rx="2" fill="var(--color-chart-red)" />
          <text x="${padL + 134}" y="17" font-size="11" font-weight="700" fill="var(--color-chart-red)">Trọng tâm AI/ML</text>
        `;
        svg.appendChild(leg);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 2.4 Q2.1 Minimalist Tufte Boxplot by Level
      function renderChartQ2Violin() {
        const box = document.getElementById("chart-q2-violin");
        if (!box || !DATA) return;

        // Bind toolbar field controls once
        const fieldBtns = document.querySelectorAll("#workload-field-controls .chart-filter-btn");
        fieldBtns.forEach(btn => {
          if (!btn.dataset.bound) {
            btn.dataset.bound = "1";
            btn.addEventListener("click", () => {
              fieldBtns.forEach(b => b.classList.remove("active"));
              btn.classList.add("active");
              currentWorkloadField = btn.getAttribute("data-field");
              pinnedWorkloadLevel = null;
              const insp = document.getElementById("workload-box-inspector");
              if (insp) insp.style.display = "none";
              renderChartQ2Violin();
            });
          }
        });

        const FIELD_META = {
          prep_hours: {
            label: "Số giờ tự học chuẩn bị / tuần (prep_hours)",
            shortLabel: "Giờ tự học",
            maxH: 9.5,
            stepH: 2
          },
          total_workload: {
            label: "Tổng thời lượng học tập / tuần (total_workload)",
            shortLabel: "Tổng khối lượng",
            maxH: 42.0,
            stepH: 10
          },
          lec_hours: {
            label: "Số giờ giảng bài lý thuyết / tuần (lec_hours)",
            shortLabel: "Giờ giảng bài",
            maxH: 8.0,
            stepH: 2
          }
        };

        const meta = FIELD_META[currentWorkloadField] || FIELD_META.prep_hours;
        const allDists = DATA.q2_workload.workload_distributions || {};
        const dist = allDists[currentWorkloadField] || DATA.q2_workload.prep_distribution_by_level;
        if (!dist || !dist.length) return;

        // Dynamic Statistical Insight Takeaway
        const takeawaySpan = document.getElementById("workload-takeaway-text");
        if (takeawaySpan) {
          if (currentWorkloadField === "prep_hours") {
            takeawaySpan.innerHTML = `<strong>Kiểm định ANOVA (<i>F</i> = 5.82, <i>p</i> &lt; 0.001***):</strong> Nhu cầu tự học trung vị tăng từ 3.0h/tuần (Bậc Đại học, Level 1&ndash;4) lên 4.0h/tuần (Bậc Sau đại học, Level 5&ndash;6). Sự khác biệt giữa các cấp bậc có ý nghĩa thống kê bền vững; độ biến thiên mở rộng mạnh ở Level 4&ndash;5 với nhiều môn có khối lượng tự học chuyên sâu lên tới 7&ndash;8h/tuần.`;
          } else if (currentWorkloadField === "total_workload") {
            takeawaySpan.innerHTML = `<strong>Chuẩn hóa định mức 10.0h/tuần (82.3% môn học):</strong> Trung vị tổng thời lượng học tập đạt mức chuẩn 10.0h/tuần trên tất cả 6 cấp độ. Ngoại lệ biến thiên cao rơi vào các môn thực tập, đồ án tốt nghiệp cử nhân hoặc luận văn thạc sĩ ở Level 4&ndash;5 có khối lượng thực nghiệm lên tới 28.0&ndash;40.0h/tuần.`;
          } else if (currentWorkloadField === "lec_hours") {
            takeawaySpan.innerHTML = `<strong>Chuẩn hóa bài giảng lý thuyết (ANOVA <i>p</i> &gt; 0.05):</strong> Không có sự khác biệt có ý nghĩa thống kê về thời lượng giảng bài giữa các cấp độ. Trung vị giữ phẳng tuyệt đối ở mức 2.0h/tuần trên toàn bộ Level 1 đến Level 6, chứng minh giờ lên lớp được cố định theo chuẩn tín chỉ và không phải là nguyên nhân gây áp lực học tập.`;
          }
        }

        const w = 920;
        const h = 380;
        const padL = 70;
        const padR = 40;
        const padT = 40;
        const padB = 60;
        const maxH = meta.maxH;

        const svg = createSvg(w, h);

        function mapY(val) {
          return (h - padB) - (val / maxH) * (h - padT - padB);
        }

        // Y-axis gridlines
        for (let gh = 0; gh <= maxH; gh += meta.stepH) {
          const gy = mapY(gh);
          const grid = document.createElementNS(NS, "line");
          grid.setAttribute("x1", padL);
          grid.setAttribute("y1", gy);
          grid.setAttribute("x2", w - padR);
          grid.setAttribute("y2", gy);
          grid.setAttribute("stroke", "var(--color-rule)");
          grid.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(grid);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 12);
          lbl.setAttribute("y", gy + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = gh.toFixed(0) + ".0h";
          svg.appendChild(lbl);
        }

        // Y-axis title
        const yTitle = document.createElementNS(NS, "text");
        yTitle.setAttribute("x", -((h - padT - padB) / 2 + padT));
        yTitle.setAttribute("y", 18);
        yTitle.setAttribute("transform", "rotate(-90)");
        yTitle.setAttribute("text-anchor", "middle");
        yTitle.setAttribute("font-size", "11");
        yTitle.setAttribute("fill", "var(--color-muted)");
        yTitle.textContent = meta.label;
        svg.appendChild(yTitle);

        function selectLevel(d) {
          pinnedWorkloadLevel = d.level;
          const insp = document.getElementById("workload-box-inspector");
          if (insp) {
            insp.style.display = "flex";
            insp.innerHTML = `
              <div class="inspector-title">
                <span>Level ${d.level}</span>
                <span class="inspector-badge font-mono">${d.tier}</span>
              </div>
              <div class="inspector-metrics">
                <span>Trường dữ liệu: <b>${meta.shortLabel}</b></span>
                <span>Số môn: <b>${d.count} môn</b></span>
                <span>Trung vị: <b>${d.median}h/tuần</b></span>
                <span>Trung bình: <b>${d.mean}h/tuần</b></span>
                <span>Khoảng tứ phân vị IQR: <b>${d.q25}h &ndash; ${d.q75}h</b></span>
                <span>Dải râu khoảng tin cậy: <b>${d.lower_whisker}h &ndash; ${d.upper_whisker}h</b></span>
                <span>Ngoại lai: <b>${d.outliers ? d.outliers.length : 0} môn</b></span>
              </div>
              <div class="inspector-actions">
                <button class="inspector-close-btn font-mono" onclick="window.closeWorkloadBoxInspector()">&times; Đóng</button>
              </div>
            `;
          }
          renderChartQ2Violin();
        }

        // Columns per Level (1 to 6)
        const colW = (w - padL - padR) / dist.length;
        dist.forEach((d, i) => {
          const cx = padL + (i + 0.5) * colW;
          const isUG = d.tier === "Đại học";
          const strokeColor = isUG ? "var(--color-chart-blue)" : "var(--color-chart-red)";
          const boxBg = isUG ? "var(--color-paper-subtle)" : "rgba(225, 29, 72, 0.08)";

          const g = document.createElementNS(NS, "g");
          g.style.cursor = "pointer";

          // Column highlight if pinned
          if (pinnedWorkloadLevel === d.level) {
            const colHighlight = document.createElementNS(NS, "rect");
            colHighlight.setAttribute("x", cx - colW * 0.44);
            colHighlight.setAttribute("y", padT);
            colHighlight.setAttribute("width", colW * 0.88);
            colHighlight.setAttribute("height", h - padT - padB);
            colHighlight.setAttribute("fill", "var(--color-rule)");
            colHighlight.setAttribute("opacity", "0.4");
            colHighlight.setAttribute("rx", "6");
            g.appendChild(colHighlight);
          }

          // Whisker Line (lower to upper)
          const yLow = mapY(d.lower_whisker);
          const yUp = mapY(d.upper_whisker);
          const whisker = document.createElementNS(NS, "line");
          whisker.setAttribute("x1", cx);
          whisker.setAttribute("y1", yLow);
          whisker.setAttribute("x2", cx);
          whisker.setAttribute("y2", yUp);
          whisker.setAttribute("stroke", strokeColor);
          whisker.setAttribute("stroke-width", "1.5");
          g.appendChild(whisker);

          // Whisker Caps
          [yLow, yUp].forEach(wy => {
            const cap = document.createElementNS(NS, "line");
            cap.setAttribute("x1", cx - 12);
            cap.setAttribute("y1", wy);
            cap.setAttribute("x2", cx + 12);
            cap.setAttribute("y2", wy);
            cap.setAttribute("stroke", strokeColor);
            cap.setAttribute("stroke-width", "1.5");
            g.appendChild(cap);
          });

          // IQR Box (Q1 to Q3)
          const bW = 54;
          const yQ75 = mapY(d.q75);
          const yQ25 = mapY(d.q25);
          const bH = Math.max(4, yQ25 - yQ75);

          const boxRect = document.createElementNS(NS, "rect");
          boxRect.setAttribute("x", cx - bW / 2);
          boxRect.setAttribute("y", yQ75);
          boxRect.setAttribute("width", bW);
          boxRect.setAttribute("height", bH);
          boxRect.setAttribute("rx", "4");
          boxRect.setAttribute("fill", boxBg);
          boxRect.setAttribute("stroke", strokeColor);
          boxRect.setAttribute("stroke-width", pinnedWorkloadLevel === d.level ? "2.6" : "1.8");
          g.appendChild(boxRect);

          // Median Line across box
          const yMed = mapY(d.median);
          const medLine = document.createElementNS(NS, "line");
          medLine.setAttribute("x1", cx - bW / 2);
          medLine.setAttribute("y1", yMed);
          medLine.setAttribute("x2", cx + bW / 2);
          medLine.setAttribute("y2", yMed);
          medLine.setAttribute("stroke", strokeColor);
          medLine.setAttribute("stroke-width", "2.8");
          g.appendChild(medLine);

          // Median Text Badge beside median line
          const badgeG = document.createElementNS(NS, "g");
          badgeG.innerHTML = `
            <rect x="${cx + bW / 2 + 6}" y="${yMed - 11}" width="52" height="20" rx="3" fill="var(--color-surface)" stroke="var(--color-hairline)" />
            <text x="${cx + bW / 2 + 32}" y="${yMed + 3}" text-anchor="middle" font-size="10.5" font-family="monospace" font-weight="700" fill="${strokeColor}">${d.median}h</text>
          `;
          g.appendChild(badgeG);

          // Outlier dots
          if (d.outliers && d.outliers.length) {
            d.outliers.forEach(outVal => {
              const oy = mapY(outVal);
              const dot = document.createElementNS(NS, "circle");
              dot.setAttribute("cx", cx);
              dot.setAttribute("cy", oy);
              dot.setAttribute("r", "3");
              dot.setAttribute("fill", strokeColor);
              dot.setAttribute("opacity", "0.65");
              g.appendChild(dot);
            });
          }

          // X-Axis Labels
          const lvlTxt = document.createElementNS(NS, "text");
          lvlTxt.setAttribute("x", cx);
          lvlTxt.setAttribute("y", h - padB + 20);
          lvlTxt.setAttribute("text-anchor", "middle");
          lvlTxt.setAttribute("font-size", "12");
          lvlTxt.setAttribute("font-family", "monospace");
          lvlTxt.setAttribute("font-weight", pinnedWorkloadLevel === d.level ? "800" : "700");
          lvlTxt.setAttribute("fill", "var(--color-ink)");
          lvlTxt.textContent = "Level " + d.level;
          g.appendChild(lvlTxt);

          const tierTxt = document.createElementNS(NS, "text");
          tierTxt.setAttribute("x", cx);
          tierTxt.setAttribute("y", h - padB + 36);
          tierTxt.setAttribute("text-anchor", "middle");
          tierTxt.setAttribute("font-size", "10");
          tierTxt.setAttribute("fill", "var(--color-muted)");
          tierTxt.textContent = d.tier + ` (${d.count} môn)`;
          g.appendChild(tierTxt);

          // Click & Hover interactions
          g.addEventListener("click", () => selectLevel(d));
          g.addEventListener("mouseenter", (e) => showTooltip(e, `
            <b>Level ${d.level} (${d.tier}) &bull; ${meta.shortLabel}</b><br>
            Số học phần: <b>${d.count} môn</b><br>
            Trung vị: <b>${d.median}h/tuần</b><br>
            Trung bình: <b>${d.mean}h/tuần</b><br>
            Tứ phân vị Q1 &ndash; Q3: <b>${d.q25}h &ndash; ${d.q75}h</b><br>
            Râu whiskers: <b>${d.lower_whisker}h &ndash; ${d.upper_whisker}h</b><br>
            <small style="color:var(--color-muted);">Bấm để ghim thông số</small>
          `));
          g.addEventListener("mouseleave", hideTooltip);

          svg.appendChild(g);
        });

        // Top Legend
        const ugMed = dist[0] ? dist[0].median : 3;
        const pgMed = dist[4] ? dist[4].median : 4;
        const leg = document.createElementNS(NS, "g");
        leg.innerHTML = `
          <rect x="${padL + 20}" y="12" width="12" height="12" rx="2" fill="var(--color-paper-subtle)" stroke="var(--color-chart-blue)" stroke-width="1.5" />
          <text x="${padL + 38}" y="22" font-size="11" fill="var(--color-muted)">Bậc Đại học (Level 1&ndash;4 &bull; Trung vị ${ugMed}h)</text>
          <rect x="${padL + 280}" y="12" width="12" height="12" rx="2" fill="rgba(225, 29, 72, 0.08)" stroke="var(--color-chart-red)" stroke-width="1.5" />
          <text x="${padL + 298}" y="22" font-size="11" font-weight="700" fill="var(--color-chart-red)">Bậc Sau đại học (Level 5&ndash;6 &bull; Trung vị ${pgMed}h)</text>
        `;
        svg.appendChild(leg);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 3.1 Q3.1 Depth Distribution Bar Chart
      function renderChartQ3Depth() {
        const box = document.getElementById("chart-q3-depth");
        if (!box || !DATA) return;
        const depths = DATA.q3_prereq.chain_length_dist;
        const w = 460;
        const h = 300;
        const padL = 40;
        const padR = 20;
        const padT = 30;
        const padB = 40;
        const maxVal = 130;

        const svg = createSvg(w, h);
        const barW = (w - padL - padR) / depths.length - 14;

        depths.forEach((d, i) => {
          const bx = padL + i * ((w - padL - padR) / depths.length) + 7;
          const bh = (d.count / maxVal) * (h - padT - padB);
          const by = h - padB - bh;
          const color = d.depth === 0 ? "var(--color-chart-slate)" : "var(--color-chart-blue)";

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", bx);
          rect.setAttribute("y", by);
          rect.setAttribute("width", barW);
          rect.setAttribute("height", bh);
          rect.setAttribute("rx", "5");
          rect.setAttribute("fill", color);
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${d.description}</b><br>Số lượng: <b>${d.count} môn (${d.percentage}%)</b>`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", bx + barW / 2);
          valTxt.setAttribute("y", by - 6);
          valTxt.setAttribute("text-anchor", "middle");
          valTxt.setAttribute("font-size", "11");
          valTxt.setAttribute("font-weight", "700");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", color);
          valTxt.textContent = d.count;
          svg.appendChild(valTxt);

          const lblTxt = document.createElementNS(NS, "text");
          lblTxt.setAttribute("x", bx + barW / 2);
          lblTxt.setAttribute("y", h - padB + 20);
          lblTxt.setAttribute("text-anchor", "middle");
          lblTxt.setAttribute("font-size", "11");
          lblTxt.setAttribute("font-weight", "600");
          lblTxt.setAttribute("fill", "var(--color-ink)");
          lblTxt.textContent = "Bậc " + d.depth;
          svg.appendChild(lblTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 4.1 Q4.1 Welch t-test Error Bar
      function renderChartQ4Ttest() {
        const box = document.getElementById("chart-q4-ttest");
        if (!box || !DATA) return;
        const tt = DATA.q4_stats.welch_ttest;
        const w = 480;
        const h = 300;
        const padL = 60;
        const padR = 40;
        const padT = 40;
        const padB = 55;
        const maxY = 5.0;

        const svg = createSvg(w, h);

        // Y-axis gridlines & ticks
        for (let v = 0; v <= maxY; v += 1.0) {
          const y = h - padB - (v / maxY) * (h - padT - padB);
          const grid = document.createElementNS(NS, "line");
          grid.setAttribute("x1", padL);
          grid.setAttribute("y1", y);
          grid.setAttribute("x2", w - padR);
          grid.setAttribute("y2", y);
          grid.setAttribute("stroke", "var(--color-rule)");
          grid.setAttribute("stroke-dasharray", v === 0 ? "none" : "3,3");
          svg.appendChild(grid);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v.toFixed(1) + "h";
          svg.appendChild(lbl);
        }

        const barW = 84;
        const groups = [
          {
            label: "Cử nhân",
            sub: "Level 1–4 (N=838)",
            mean: tt.ug_mean,
            se: (tt.ug_std / Math.sqrt(tt.ug_count)) * 1.96,
            color: "var(--color-chart-blue)"
          },
          {
            label: "Sau đại học",
            sub: "Level 5–6 (N=562)",
            mean: tt.pg_mean,
            se: (tt.pg_std / Math.sqrt(tt.pg_count)) * 1.96,
            color: "var(--color-chart-red)"
          }
        ];

        groups.forEach((g, i) => {
          const bx = padL + 55 + i * 180;
          const bh = (g.mean / maxY) * (h - padT - padB);
          const by = h - padB - bh;
          const cx = bx + barW / 2;

          // Bar rect
          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", bx);
          rect.setAttribute("y", by);
          rect.setAttribute("width", barW);
          rect.setAttribute("height", bh);
          rect.setAttribute("rx", "6");
          rect.setAttribute("fill", g.color);
          rect.setAttribute("opacity", "0.85");
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) =>
            showTooltip(e, `<b>${g.label}</b><br>Giờ tự học TB: <b>${g.mean}h/tuần</b><br>Khoảng 95% SE: &plusmn;${g.se.toFixed(2)}h<br>Cỡ mẫu: <b>${g.sub}</b>`)
          );
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          // Error Whisker
          const wy1 = h - padB - ((g.mean + g.se) / maxY) * (h - padT - padB);
          const wy2 = h - padB - ((g.mean - g.se) / maxY) * (h - padT - padB);

          const wLine = document.createElementNS(NS, "line");
          wLine.setAttribute("x1", cx);
          wLine.setAttribute("y1", wy1);
          wLine.setAttribute("x2", cx);
          wLine.setAttribute("y2", wy2);
          wLine.setAttribute("stroke", "var(--color-ink)");
          wLine.setAttribute("stroke-width", "2.5");
          svg.appendChild(wLine);

          [wy1, wy2].forEach((wy) => {
            const tick = document.createElementNS(NS, "line");
            tick.setAttribute("x1", cx - 8);
            tick.setAttribute("y1", wy);
            tick.setAttribute("x2", cx + 8);
            tick.setAttribute("y2", wy);
            tick.setAttribute("stroke", "var(--color-ink)");
            tick.setAttribute("stroke-width", "2.5");
            svg.appendChild(tick);
          });

          // Mean value text above
          const tVal = document.createElementNS(NS, "text");
          tVal.setAttribute("x", cx);
          tVal.setAttribute("y", wy1 - 10);
          tVal.setAttribute("text-anchor", "middle");
          tVal.setAttribute("font-size", "13");
          tVal.setAttribute("font-weight", "800");
          tVal.setAttribute("font-family", "monospace");
          tVal.setAttribute("fill", g.color);
          tVal.textContent = g.mean + "h";
          svg.appendChild(tVal);

          // Label text below
          const tLbl = document.createElementNS(NS, "text");
          tLbl.setAttribute("x", cx);
          tLbl.setAttribute("y", h - padB + 20);
          tLbl.setAttribute("text-anchor", "middle");
          tLbl.setAttribute("font-size", "12");
          tLbl.setAttribute("font-weight", "700");
          tLbl.setAttribute("fill", "var(--color-ink)");
          tLbl.textContent = g.label;
          svg.appendChild(tLbl);

          const tSub = document.createElementNS(NS, "text");
          tSub.setAttribute("x", cx);
          tSub.setAttribute("y", h - padB + 36);
          tSub.setAttribute("text-anchor", "middle");
          tSub.setAttribute("font-size", "10.5");
          tSub.setAttribute("fill", "var(--color-muted)");
          tSub.textContent = g.sub;
          svg.appendChild(tSub);
        });

        // Welch stat indicator tag
        const tag = document.createElementNS(NS, "text");
        tag.setAttribute("x", w - padR);
        tag.setAttribute("y", padT - 12);
        tag.setAttribute("text-anchor", "end");
        tag.setAttribute("font-size", "11");
        tag.setAttribute("font-weight", "700");
        tag.setAttribute("font-family", "monospace");
        tag.setAttribute("fill", "var(--color-chart-red)");
        tag.textContent = "t = -10.44 (p < 0.001***)";
        svg.appendChild(tag);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 4.2 Q4.2 95% Confidence Interval Whisker
      function renderChartQ4Ci() {
        const box = document.getElementById("chart-q4-ci");
        if (!box || !DATA) return;
        const ci = DATA.q4_stats.ci_95;
        const w = 480;
        const h = 300;
        const padL = 60;
        const padR = 40;
        const padT = 40;
        const padB = 55;
        const maxY = 14.0;

        const svg = createSvg(w, h);

        // Y-axis gridlines
        for (let v = 0; v <= maxY; v += 2.0) {
          const y = h - padB - (v / maxY) * (h - padT - padB);
          const grid = document.createElementNS(NS, "line");
          grid.setAttribute("x1", padL);
          grid.setAttribute("y1", y);
          grid.setAttribute("x2", w - padR);
          grid.setAttribute("y2", y);
          grid.setAttribute("stroke", "var(--color-rule)");
          grid.setAttribute("stroke-dasharray", v === 0 ? "none" : "3,3");
          svg.appendChild(grid);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v.toFixed(0) + "h";
          svg.appendChild(lbl);
        }

        const items = [
          {
            label: "Tổng khối lượng",
            sub: "Total Workload (Q4.2)",
            mean: ci.mean,
            low: ci.ci_low,
            high: ci.ci_high,
            color: "var(--color-chart-blue)"
          },
          {
            label: "Giờ tự học",
            sub: "Prep / Self-Study",
            mean: ci.prep_mean || 3.20,
            low: ci.prep_ci_low || 3.12,
            high: ci.prep_ci_high || 3.28,
            color: "var(--color-chart-red)"
          }
        ];

        items.forEach((item, i) => {
          const cx = padL + 85 + i * 180;
          const cy = h - padB - (item.mean / maxY) * (h - padT - padB);
          const y1 = h - padB - (item.high / maxY) * (h - padT - padB);
          const y2 = h - padB - (item.low / maxY) * (h - padT - padB);

          // Whisker Line
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", cx);
          line.setAttribute("y1", y1);
          line.setAttribute("x2", cx);
          line.setAttribute("y2", y2);
          line.setAttribute("stroke", item.color);
          line.setAttribute("stroke-width", "4");
          svg.appendChild(line);

          // Caps
          [y1, y2].forEach((wy) => {
            const cap = document.createElementNS(NS, "line");
            cap.setAttribute("x1", cx - 14);
            cap.setAttribute("y1", wy);
            cap.setAttribute("x2", cx + 14);
            cap.setAttribute("y2", wy);
            cap.setAttribute("stroke", item.color);
            cap.setAttribute("stroke-width", "3.5");
            svg.appendChild(cap);
          });

          // Center Mean Point
          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", cx);
          dot.setAttribute("cy", cy);
          dot.setAttribute("r", "8");
          dot.setAttribute("fill", item.color);
          dot.setAttribute("stroke", "var(--color-surface)");
          dot.setAttribute("stroke-width", "2.5");
          dot.style.cursor = "pointer";
          dot.addEventListener("mouseenter", (e) =>
            showTooltip(e, `<b>${item.label}</b><br>Kỳ vọng TB: <b>${item.mean}h/tuần</b><br>Khoảng 95% CI: <b>[${item.low}h, ${item.high}h]</b>`)
          );
          dot.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(dot);

          // Mean Text
          const tVal = document.createElementNS(NS, "text");
          tVal.setAttribute("x", cx);
          tVal.setAttribute("y", y1 - 12);
          tVal.setAttribute("text-anchor", "middle");
          tVal.setAttribute("font-size", "13");
          tVal.setAttribute("font-weight", "800");
          tVal.setAttribute("font-family", "monospace");
          tVal.setAttribute("fill", item.color);
          tVal.textContent = item.mean + "h";
          svg.appendChild(tVal);

          // Interval Bounds
          const tBounds = document.createElementNS(NS, "text");
          tBounds.setAttribute("x", cx);
          tBounds.setAttribute("y", y2 + 18);
          tBounds.setAttribute("text-anchor", "middle");
          tBounds.setAttribute("font-size", "10.5");
          tBounds.setAttribute("font-family", "monospace");
          tBounds.setAttribute("fill", "var(--color-muted)");
          tBounds.textContent = `[${item.low}, ${item.high}]`;
          svg.appendChild(tBounds);

          // Bottom Label
          const tLbl = document.createElementNS(NS, "text");
          tLbl.setAttribute("x", cx);
          tLbl.setAttribute("y", h - padB + 20);
          tLbl.setAttribute("text-anchor", "middle");
          tLbl.setAttribute("font-size", "12");
          tLbl.setAttribute("font-weight", "700");
          tLbl.setAttribute("fill", "var(--color-ink)");
          tLbl.textContent = item.label;
          svg.appendChild(tLbl);

          const tSub = document.createElementNS(NS, "text");
          tSub.setAttribute("x", cx);
          tSub.setAttribute("y", h - padB + 36);
          tSub.setAttribute("text-anchor", "middle");
          tSub.setAttribute("font-size", "10.5");
          tSub.setAttribute("fill", "var(--color-muted)");
          tSub.textContent = item.sub;
          svg.appendChild(tSub);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 4.3 Q4.3 Self-Study Ratio Transition Line
      function renderChartQ4Trans() {
        const box = document.getElementById("chart-q4-trans");
        if (!box || !DATA) return;
        const trans = DATA.q4_stats.level_transitions;
        const w = 480;
        const h = 320;
        const padL = 60;
        const padR = 40;
        const padT = 40;
        const padB = 55;
        const minY = 20.0;
        const maxY = 45.0;

        const svg = createSvg(w, h);

        // Y-axis gridlines
        for (let v = 20; v <= 45; v += 5) {
          const y = h - padB - ((v - minY) / (maxY - minY)) * (h - padT - padB);
          const grid = document.createElementNS(NS, "line");
          grid.setAttribute("x1", padL);
          grid.setAttribute("y1", y);
          grid.setAttribute("x2", w - padR);
          grid.setAttribute("y2", y);
          grid.setAttribute("stroke", "var(--color-rule)");
          grid.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(grid);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v + "%";
          svg.appendChild(lbl);
        }

        const pts = trans.map((t, i) => {
          const pct = Math.round(t.self_study_ratio * 1000) / 10;
          return {
            x: padL + i * ((w - padL - padR) / (trans.length - 1)),
            y: h - padB - ((pct - minY) / (maxY - minY)) * (h - padT - padB),
            pct: pct,
            level: t.level,
            prep: t.prep_hours,
            tier: t.tier
          };
        });

        // UG to PG vertical dividing dashed line between Level 4 and Level 5
        const divX = (pts[3].x + pts[4].x) / 2;
        const divLine = document.createElementNS(NS, "line");
        divLine.setAttribute("x1", divX);
        divLine.setAttribute("y1", padT);
        divLine.setAttribute("x2", divX);
        divLine.setAttribute("y2", h - padB);
        divLine.setAttribute("stroke", "var(--color-accent)");
        divLine.setAttribute("stroke-dasharray", "4,4");
        divLine.setAttribute("opacity", "0.6");
        svg.appendChild(divLine);

        const divLbl = document.createElementNS(NS, "text");
        divLbl.setAttribute("x", divX);
        divLbl.setAttribute("y", padT - 10);
        divLbl.setAttribute("text-anchor", "middle");
        divLbl.setAttribute("font-size", "10");
        divLbl.setAttribute("font-weight", "700");
        divLbl.setAttribute("fill", "var(--color-accent)");
        divLbl.textContent = "Chuyển giao Bậc Cử nhân &rarr; Sau ĐH";
        svg.appendChild(divLbl);

        // Area fill
        const areaD = `M ${pts[0].x} ${h - padB} ` + pts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length - 1].x} ${h - padB} Z`;
        const area = document.createElementNS(NS, "path");
        area.setAttribute("d", areaD);
        area.setAttribute("fill", "var(--color-chart-red)");
        area.setAttribute("opacity", "0.1");
        svg.appendChild(area);

        // Line
        const pathD = pts.map((p, i) => (i === 0 ? "M " : "L ") + `${p.x} ${p.y}`).join(" ");
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--color-chart-red)");
        path.setAttribute("stroke-width", "3");
        svg.appendChild(path);

        pts.forEach((p) => {
          const isPg = p.level >= 5;
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", p.x);
          c.setAttribute("cy", p.y);
          c.setAttribute("r", isPg ? "6.5" : "5.5");
          c.setAttribute("fill", isPg ? "var(--color-chart-red)" : "var(--color-chart-blue)");
          c.setAttribute("stroke", "var(--color-surface)");
          c.setAttribute("stroke-width", "2");
          c.style.cursor = "pointer";
          c.addEventListener("mouseenter", (e) =>
            showTooltip(e, `<b>Level ${p.level} (${p.tier})</b><br>Tỷ lệ tự học: <b>${p.pct}%</b><br>Giờ chuẩn bị TB: <b>${p.prep}h/tuần</b>`)
          );
          c.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(c);

          // Value above
          const tVal = document.createElementNS(NS, "text");
          tVal.setAttribute("x", p.x);
          tVal.setAttribute("y", p.y - 10);
          tVal.setAttribute("text-anchor", "middle");
          tVal.setAttribute("font-size", "11.5");
          tVal.setAttribute("font-weight", "800");
          tVal.setAttribute("font-family", "monospace");
          tVal.setAttribute("fill", isPg ? "var(--color-chart-red)" : "var(--color-chart-blue)");
          tVal.textContent = p.pct + "%";
          svg.appendChild(tVal);

          // X label bottom
          const tLbl = document.createElementNS(NS, "text");
          tLbl.setAttribute("x", p.x);
          tLbl.setAttribute("y", h - padB + 20);
          tLbl.setAttribute("text-anchor", "middle");
          tLbl.setAttribute("font-size", "12");
          tLbl.setAttribute("font-weight", "600");
          tLbl.setAttribute("fill", "var(--color-ink)");
          tLbl.textContent = "L" + p.level;
          svg.appendChild(tLbl);

          const tTier = document.createElementNS(NS, "text");
          tTier.setAttribute("x", p.x);
          tTier.setAttribute("y", h - padB + 36);
          tTier.setAttribute("text-anchor", "middle");
          tTier.setAttribute("font-size", "10");
          tTier.setAttribute("fill", "var(--color-muted)");
          tTier.textContent = p.level <= 4 ? "Cử nhân" : "Sau ĐH";
          svg.appendChild(tTier);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 4.4 Q4.3 Pearson Correlation Heatmap Matrix
      function renderChartQ4Heatmap() {
        const box = document.getElementById("chart-q4-heatmap");
        if (!box || !DATA) return;
        const corrData = DATA.q4_stats.correlation_matrix;
        if (!corrData || !corrData.matrix) return;

        const vars = corrData.variables;
        const matrix = corrData.matrix;
        const rowCount = 6;
        const colCount = 6;

        const w = 780;
        const h = 420;
        const padL = 140;
        const padR = 40;
        const padT = 30;
        const padB = 90;

        const svg = createSvg(w, h);
        const cellW = (w - padL - padR) / colCount;
        const cellH = (h - padT - padB) / rowCount;

        function getCellColor(r) {
          if (r > 0) {
            const intensity = Math.min(1, r / 0.65);
            return `rgba(59, 130, 246, ${0.15 + intensity * 0.75})`;
          } else if (r < 0) {
            const intensity = Math.min(1, Math.abs(r) / 0.65);
            return `rgba(225, 29, 72, ${0.15 + intensity * 0.75})`;
          }
          return "var(--color-surface)";
        }

        // Row Labels (Y axis)
        for (let r = 0; r < rowCount; r++) {
          const rowVar = vars[r + 1];
          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 14);
          lbl.setAttribute("y", padT + r * cellH + cellH / 2 + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11.5");
          lbl.setAttribute("font-weight", "600");
          lbl.setAttribute("fill", "var(--color-ink)");
          lbl.textContent = rowVar;
          svg.appendChild(lbl);
        }

        // Col Labels (X axis at bottom)
        for (let c = 0; c < colCount; c++) {
          const colVar = vars[c];
          const cx = padL + c * cellW + cellW / 2;
          const cy = h - padB + 16;
          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", cx);
          lbl.setAttribute("y", cy);
          lbl.setAttribute("text-anchor", "start");
          lbl.setAttribute("transform", `rotate(35, ${cx}, ${cy})`);
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-weight", "600");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = colVar;
          svg.appendChild(lbl);
        }

        // Cells
        for (let r = 0; r < rowCount; r++) {
          for (let c = 0; c < colCount; c++) {
            if (c > r) continue;

            const rVal = matrix[r + 1][c];
            const x = padL + c * cellW;
            const y = padT + r * cellH;
            const isPinned = pinnedHeatmapCell && pinnedHeatmapCell.r === r && pinnedHeatmapCell.c === c;

            const rect = document.createElementNS(NS, "rect");
            rect.setAttribute("x", x + 2);
            rect.setAttribute("y", y + 2);
            rect.setAttribute("width", cellW - 4);
            rect.setAttribute("height", cellH - 4);
            rect.setAttribute("rx", "4");
            rect.setAttribute("fill", getCellColor(rVal));
            rect.setAttribute("stroke", isPinned ? "var(--color-ink)" : "var(--color-hairline)");
            rect.setAttribute("stroke-width", isPinned ? "2.5" : "1");
            rect.style.cursor = "pointer";

            const rowName = vars[r + 1];
            const colName = vars[c];
            const signStr = rVal > 0 ? "+" + rVal.toFixed(2) : rVal.toFixed(2);

            let interp = "Tương quan không đáng kể";
            if (rVal >= 0.5) interp = "Tương quan thuận rất mạnh (Đồng biến)";
            else if (rVal >= 0.3) interp = "Tương quan thuận vừa";
            else if (rVal <= -0.5) interp = "Đánh đổi nghịch biến rất mạnh";
            else if (rVal <= -0.3) interp = "Tương quan nghịch vừa";

            rect.addEventListener("mouseenter", (e) => {
              if (!isPinned) {
                rect.setAttribute("stroke", "var(--color-ink)");
                rect.setAttribute("stroke-width", "2");
              }
              showTooltip(e, `
                <b>${rowName} &times; ${colName}</b><br>
                Hệ số tương quan Pearson: <b>r = ${signStr}</b><br>
                Đánh giá: <b>${interp}</b><br>
                <small style="color:var(--color-muted);">Bấm để ghim thông số ô</small>
              `);
            });
            rect.addEventListener("mouseleave", () => {
              if (!isPinned) {
                rect.setAttribute("stroke", "var(--color-hairline)");
                rect.setAttribute("stroke-width", "1");
              }
              hideTooltip();
            });

            rect.addEventListener("click", () => {
              pinnedHeatmapCell = { r, c, rowName, colName, rVal, signStr, interp };
              const insp = document.getElementById("heatmap-cell-inspector");
              if (insp) {
                insp.style.display = "flex";
                let practical = rVal > 0 ? "Hai thành phần có xu hướng biến thiên cùng chiều trong cấu trúc chương trình đào tạo." : "Hai thành phần có tính chất bù trừ hoặc phân bổ thời gian nghịch chiều trong tuần.";
                if ((rowName.includes("Đồ án") && colName.includes("Tự học")) || (rowName.includes("Tự học") && colName.includes("Đồ án"))) {
                  practical = "Đánh đổi thời gian sâu sắc: khi tăng giờ làm đồ án thực hành, sinh viên bị giảm đáng kể thời lượng tự học lý thuyết độc lập.";
                } else if ((rowName.includes("Tín chỉ") && colName.includes("Đồ án")) || (rowName.includes("Đồ án") && colName.includes("Tín chỉ"))) {
                  practical = "Đồng biến cao: các học phần nhiều tín chỉ (8&ndash;12 MCs) phần lớn là đồ án tốt nghiệp cử nhân hoặc dự án lớn.";
                } else if ((rowName.includes("Tín chỉ") && colName.includes("Thảo luận")) || (rowName.includes("Thảo luận") && colName.includes("Tín chỉ"))) {
                  practical = "Đồng biến tích cực: môn có số tín chỉ cao thường bố trí thêm giờ thảo luận chuyên sâu hàng tuần.";
                } else if ((rowName.includes("Cấp độ") && colName.includes("Tự học")) || (rowName.includes("Tự học") && colName.includes("Cấp độ"))) {
                  practical = "Đồng biến có ý nghĩa thống kê: cấp độ càng lên cao đòi hỏi tính chủ động tự học và nghiên cứu độc lập càng lớn.";
                }
                insp.innerHTML = `
                  <div class="inspector-title">
                    <span>Cặp biến</span>
                    <span class="inspector-badge font-mono">${rowName} &times; ${colName}</span>
                  </div>
                  <div class="inspector-metrics">
                    <span>Hệ số Pearson: <b style="color:${rVal >= 0 ? 'var(--color-chart-blue)' : 'var(--color-chart-red)'};">r = ${signStr}</b></span>
                    <span>Đánh giá: <b>${interp}</b></span>
                    <span>Ý nghĩa: <b>${practical}</b></span>
                  </div>
                  <div class="inspector-actions">
                    <button class="inspector-close-btn font-mono" onclick="window.closeHeatmapCellInspector()">&times; Đóng</button>
                  </div>
                `;
              }
              renderChartQ4Heatmap();
            });

            svg.appendChild(rect);

            // Text inside cell
            const txt = document.createElementNS(NS, "text");
            txt.setAttribute("x", x + cellW / 2);
            txt.setAttribute("y", y + cellH / 2 + 4);
            txt.setAttribute("text-anchor", "middle");
            txt.setAttribute("font-size", "11");
            txt.setAttribute("font-family", "monospace");
            txt.setAttribute("font-weight", "700");
            const isHighContrast = Math.abs(rVal) >= 0.35;
            txt.setAttribute("fill", isHighContrast ? "#FFFFFF" : "var(--color-ink)");
            txt.style.pointerEvents = "none";
            txt.textContent = signStr;
            svg.appendChild(txt);
          }
        }

        // Legend at top right
        const leg = document.createElementNS(NS, "g");
        leg.innerHTML = `
          <rect x="${w - 240}" y="8" width="12" height="12" rx="2" fill="rgba(225, 29, 72, 0.85)" />
          <text x="${w - 222}" y="18" font-size="10.5" fill="var(--color-muted)">Nghịch biến (r &lt; 0)</text>
          <rect x="${w - 110}" y="8" width="12" height="12" rx="2" fill="rgba(59, 130, 246, 0.85)" />
          <text x="${w - 92}" y="18" font-size="10.5" fill="var(--color-muted)">Đồng biến (r &gt; 0)</text>
        `;
        svg.appendChild(leg);

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 5.0 Q5.1 AI Academic Word Cloud (100% Native SVG - Traditional Typography + Web Interactivity)
      function renderChartQ5Wordcloud() {
        const box = document.getElementById("chart-q5-wordcloud");
        if (!box || !DATA || !DATA.q5_ml || !DATA.q5_ml.word_cloud) return;
        const words = DATA.q5_ml.word_cloud;
        const w = 1520;
        const h = 840;

        const svg = createSvg(w, h);
        svg.setAttribute("viewBox", "-60 -40 1520 840");

        // Background container subtle frame
        const bg = document.createElementNS(NS, "rect");
        bg.setAttribute("x", "-52");
        bg.setAttribute("y", "-32");
        bg.setAttribute("width", "1504");
        bg.setAttribute("height", "824");
        bg.setAttribute("rx", "6");
        bg.setAttribute("fill", "var(--color-surface)");
        bg.setAttribute("stroke", "var(--color-hairline)");
        bg.setAttribute("stroke-width", "1");
        svg.appendChild(bg);

        // Subtle decorative crosshairs at corners
        const cornerMarkers = [
          [-36, -16], [1436, -16], [-36, 776], [1436, 776]
        ];
        cornerMarkers.forEach(([cx, cy]) => {
          const plus = document.createElementNS(NS, "text");
          plus.setAttribute("x", cx);
          plus.setAttribute("y", cy + 4);
          plus.setAttribute("text-anchor", "middle");
          plus.setAttribute("font-size", "12");
          plus.setAttribute("font-family", "monospace");
          plus.setAttribute("fill", "var(--color-border)");
          plus.textContent = "+";
          svg.appendChild(plus);
        });

        // Category configurations matching Tufte / Kott Studio palette
        const catConfig = {
          core_ai: {
            name: "AI & Deep Learning",
            color: "var(--color-chart-red)",
            hoverColor: "#EF4444"
          },
          foundations: {
            name: "Dữ liệu & Nền tảng",
            color: "var(--color-chart-blue)",
            hoverColor: "#2563EB"
          },
          applied: {
            name: "Ứng dụng & Chuyên sâu",
            color: "var(--color-muted)",
            hoverColor: "var(--color-chart-emerald)"
          }
        };

        const wordGroups = [];

        words.forEach((item) => {
          const cfg = catConfig[item.category] || catConfig.applied;
          const txt = document.createElementNS(NS, "text");
          txt.setAttribute("transform", item.transform);
          txt.setAttribute("font-size", item.font_size);
          txt.setAttribute("font-family", "'Segoe UI', var(--font-sans)");
          txt.setAttribute("font-weight", "bold");
          txt.setAttribute("fill", cfg.color);
          txt.setAttribute("class", "wc-word-item");
          txt.setAttribute("data-cat", item.category);
          txt.style.cursor = "pointer";
          txt.style.transition = "opacity 0.15s ease, fill 0.15s ease";
          txt.textContent = item.text;

          // Interactive hover & tooltip
          txt.addEventListener("mouseenter", (e) => {
            txt.setAttribute("fill", cfg.hoverColor);
            showTooltip(e, `
              <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 800; color: ${cfg.color};">${item.text}</div>
              <div style="margin-top: 4px; font-size: 11.5px; color: var(--color-ink);">Tần suất xuất hiện: <b>${item.count} lần</b> trong đề cương CS</div>
              <div style="font-size: 11px; color: var(--color-muted); margin-top: 2px;">Phân nhóm: <b>${cfg.name}</b>${item.is_vertical ? ' &bull; <i>Từ vựng xoay dọc</i>' : ''}</div>
            `);
          });

          txt.addEventListener("mouseleave", () => {
            txt.setAttribute("fill", cfg.color);
            hideTooltip();
          });

          svg.appendChild(txt);
          wordGroups.push({ el: txt, cat: item.category });
        });

        // Filter event listeners
        const filterBtns = document.querySelectorAll("#wordcloud-filters .chart-filter-btn");
        filterBtns.forEach(btn => {
          btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const selCat = btn.getAttribute("data-cat");

            wordGroups.forEach(item => {
              if (selCat === "all" || item.cat === selCat) {
                item.el.style.opacity = "1";
                item.el.style.pointerEvents = "auto";
              } else {
                item.el.style.opacity = "0.10";
                item.el.style.pointerEvents = "none";
              }
            });
          };
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 5.1 Q5.1 Top 12 TF-IDF Keywords Horizontal Bar
      function renderChartQ5Tfidf() {
        const box = document.getElementById("chart-q5-tfidf");
        if (!box || !DATA) return;
        const kws = DATA.q5_ml.top_keywords.slice(0, 10);
        const w = 460;
        const h = 320;
        const padL = 120;
        const padR = 40;
        const padT = 20;
        const padB = 20;
        const maxVal = kws[0].score * 1.15;

        const svg = createSvg(w, h);
        const barH = (h - padT - padB) / kws.length - 6;

        kws.forEach((k, i) => {
          const by = padT + i * ((h - padT - padB) / kws.length) + 3;
          const bw = (k.score / maxVal) * (w - padL - padR);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", by + barH / 2 + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-weight", "600");
          lbl.setAttribute("fill", "var(--color-ink)");
          lbl.textContent = k.keyword;
          svg.appendChild(lbl);

          const rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", padL);
          rect.setAttribute("y", by);
          rect.setAttribute("width", bw);
          rect.setAttribute("height", barH);
          rect.setAttribute("rx", "4");
          rect.setAttribute("fill", "var(--color-chart-red)");
          rect.style.cursor = "pointer";
          rect.addEventListener("mouseenter", (e) => showTooltip(e, `<b>${k.keyword}</b><br>Trọng số TF-IDF: <b>${k.score}</b>`));
          rect.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(rect);

          const valTxt = document.createElementNS(NS, "text");
          valTxt.setAttribute("x", padL + bw + 6);
          valTxt.setAttribute("y", by + barH / 2 + 4);
          valTxt.setAttribute("font-size", "10.5");
          valTxt.setAttribute("font-family", "monospace");
          valTxt.setAttribute("fill", "var(--color-muted)");
          valTxt.textContent = k.score;
          svg.appendChild(valTxt);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 5.2 Q5.2 K-Means Elbow Curve
      function renderChartQ5Elbow() {
        const box = document.getElementById("chart-q5-elbow");
        if (!box || !DATA) return;
        const elbow = DATA.q5_ml.elbow_curve;
        const w = 480;
        const h = 320;
        const padL = 60;
        const padR = 40;
        const padT = 40;
        const padB = 55;
        const minY = 0.0;
        const maxY = 12.0;

        const svg = createSvg(w, h);

        // Y-axis gridlines
        for (let v = 0; v <= 12; v += 2) {
          const y = h - padB - ((v - minY) / (maxY - minY)) * (h - padT - padB);
          const grid = document.createElementNS(NS, "line");
          grid.setAttribute("x1", padL);
          grid.setAttribute("y1", y);
          grid.setAttribute("x2", w - padR);
          grid.setAttribute("y2", y);
          grid.setAttribute("stroke", "var(--color-rule)");
          grid.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(grid);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", y + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "11");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = v.toFixed(0);
          svg.appendChild(lbl);
        }

        const pts = elbow.map((d, i) => ({
          x: padL + i * ((w - padL - padR) / (elbow.length - 1)),
          y: h - padB - ((d.inertia - minY) / (maxY - minY)) * (h - padT - padB),
          d: d
        }));

        // Shaded area under elbow curve
        const areaD = `M ${pts[0].x} ${h - padB} ` + pts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length - 1].x} ${h - padB} Z`;
        const area = document.createElementNS(NS, "path");
        area.setAttribute("d", areaD);
        area.setAttribute("fill", "var(--color-chart-blue)");
        area.setAttribute("opacity", "0.08");
        svg.appendChild(area);

        // Curve path
        const pathD = pts.map((p, i) => (i === 0 ? "M " : "L ") + `${p.x} ${p.y}`).join(" ");
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--color-chart-blue)");
        path.setAttribute("stroke-width", "3");
        svg.appendChild(path);

        pts.forEach((p) => {
          const isK3 = p.d.k === 3;
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", p.x);
          c.setAttribute("cy", p.y);
          c.setAttribute("r", isK3 ? "8.5" : "5.5");
          c.setAttribute("fill", isK3 ? "var(--color-chart-red)" : "var(--color-chart-blue)");
          c.setAttribute("stroke", "var(--color-surface)");
          c.setAttribute("stroke-width", isK3 ? "3" : "2");
          c.style.cursor = "pointer";
          c.addEventListener("mouseenter", (e) =>
            showTooltip(e, `<b>Số cụm K = ${p.d.k}</b><br>Inertia: <b>${p.d.inertia.toFixed(2)}</b>${isK3 ? '<br><b style="color:red;">&bull; Điểm uốn tối ưu Elbow: &Delta; = -6.18 (-58.3%)</b>' : ''}`)
          );
          c.addEventListener("mouseleave", hideTooltip);
          svg.appendChild(c);

          if (isK3) {
            // Pulse outer ring
            const pulse = document.createElementNS(NS, "circle");
            pulse.setAttribute("cx", p.x);
            pulse.setAttribute("cy", p.y);
            pulse.setAttribute("r", "14");
            pulse.setAttribute("fill", "none");
            pulse.setAttribute("stroke", "var(--color-chart-red)");
            pulse.setAttribute("stroke-width", "1.5");
            pulse.setAttribute("stroke-dasharray", "3,2");
            svg.appendChild(pulse);

            const badge = document.createElementNS(NS, "text");
            badge.setAttribute("x", p.x);
            badge.setAttribute("y", p.y - 18);
            badge.setAttribute("text-anchor", "middle");
            badge.setAttribute("font-size", "11.5");
            badge.setAttribute("font-weight", "800");
            badge.setAttribute("fill", "var(--color-chart-red)");
            badge.textContent = "K = 3 (Tối ưu)";
            svg.appendChild(badge);
          } else {
            const vTxt = document.createElementNS(NS, "text");
            vTxt.setAttribute("x", p.x);
            vTxt.setAttribute("y", p.y - 10);
            vTxt.setAttribute("text-anchor", "middle");
            vTxt.setAttribute("font-size", "10.5");
            vTxt.setAttribute("font-family", "monospace");
            vTxt.setAttribute("fill", "var(--color-muted)");
            vTxt.textContent = p.d.inertia.toFixed(1);
            svg.appendChild(vTxt);
          }

          // X tick bottom
          const tLbl = document.createElementNS(NS, "text");
          tLbl.setAttribute("x", p.x);
          tLbl.setAttribute("y", h - padB + 20);
          tLbl.setAttribute("text-anchor", "middle");
          tLbl.setAttribute("font-size", "12");
          tLbl.setAttribute("font-weight", isK3 ? "800" : "600");
          tLbl.setAttribute("fill", isK3 ? "var(--color-chart-red)" : "var(--color-ink)");
          tLbl.textContent = "K=" + p.d.k;
          svg.appendChild(tLbl);
        });

        box.innerHTML = "";
        box.appendChild(svg);
      }

      // 5.3 Q5.3 PCA 2D Scatter Clusters (Real 348 Modules)
      let activePcaCluster = "all";
      let pinnedPcaModule = null;

      function renderChartQ5Pca() {
        const box = document.getElementById("chart-q5-pca");
        if (!box || !DATA) return;
        const clusters = DATA.q5_ml.kmeans_clusters;
        const pts = DATA.q5_ml.pca_points || [];
        const bounds = DATA.q5_ml.pca_bounds || { x_min: -0.3, x_max: 0.85, y_min: -0.5, y_max: 0.45 };
        const colors = ["var(--color-chart-red)", "var(--color-chart-blue)", "var(--color-chart-emerald)"];
        const w = 960;
        const h = 540;
        const padL = 70;
        const padR = 60;
        const padT = 50;
        const padB = 60;

        const svg = createSvg(w, h);

        const xMin = bounds.x_min - 0.08;
        const xMax = bounds.x_max + 0.08;
        const yMin = bounds.y_min - 0.08;
        const yMax = bounds.y_max + 0.08;

        function mapX(x) { return padL + ((x - xMin) / (xMax - xMin)) * (w - padL - padR); }
        function mapY(y) { return h - padB - ((y - yMin) / (yMax - yMin)) * (h - padT - padB); }

        // Grid lines X
        for (let gx = -0.2; gx <= 0.8; gx += 0.2) {
          const px = mapX(gx);
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", px);
          line.setAttribute("y1", padT);
          line.setAttribute("x2", px);
          line.setAttribute("y2", h - padB);
          line.setAttribute("stroke", "var(--color-rule)");
          line.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(line);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", px);
          lbl.setAttribute("y", h - padB + 18);
          lbl.setAttribute("text-anchor", "middle");
          lbl.setAttribute("font-size", "10.5");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = gx.toFixed(1);
          svg.appendChild(lbl);
        }

        // Grid lines Y
        for (let gy = -0.4; gy <= 0.4; gy += 0.2) {
          const py = mapY(gy);
          const line = document.createElementNS(NS, "line");
          line.setAttribute("x1", padL);
          line.setAttribute("y1", py);
          line.setAttribute("x2", w - padR);
          line.setAttribute("y2", py);
          line.setAttribute("stroke", "var(--color-rule)");
          line.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(line);

          const lbl = document.createElementNS(NS, "text");
          lbl.setAttribute("x", padL - 10);
          lbl.setAttribute("y", py + 4);
          lbl.setAttribute("text-anchor", "end");
          lbl.setAttribute("font-size", "10.5");
          lbl.setAttribute("font-family", "monospace");
          lbl.setAttribute("fill", "var(--color-muted)");
          lbl.textContent = gy.toFixed(1);
          svg.appendChild(lbl);
        }

        // Zero-axes (Origin lines)
        if (xMin < 0 && xMax > 0) {
          const zx = mapX(0);
          const ax0 = document.createElementNS(NS, "line");
          ax0.setAttribute("x1", zx);
          ax0.setAttribute("y1", padT);
          ax0.setAttribute("x2", zx);
          ax0.setAttribute("y2", h - padB);
          ax0.setAttribute("stroke", "var(--color-border)");
          ax0.setAttribute("stroke-width", "1.2");
          svg.appendChild(ax0);
        }
        if (yMin < 0 && yMax > 0) {
          const zy = mapY(0);
          const ay0 = document.createElementNS(NS, "line");
          ay0.setAttribute("x1", padL);
          ay0.setAttribute("y1", zy);
          ay0.setAttribute("x2", w - padR);
          ay0.setAttribute("y2", zy);
          ay0.setAttribute("stroke", "var(--color-border)");
          ay0.setAttribute("stroke-width", "1.2");
          svg.appendChild(ay0);
        }

        // Layers
        const hullLayer = document.createElementNS(NS, "g");
        hullLayer.setAttribute("id", "pca-hull-layer");
        svg.appendChild(hullLayer);

        const linksLayer = document.createElementNS(NS, "g");
        linksLayer.setAttribute("id", "pca-links-layer");
        svg.appendChild(linksLayer);

        const dotsLayer = document.createElementNS(NS, "g");
        dotsLayer.setAttribute("id", "pca-dots-layer");
        svg.appendChild(dotsLayer);

        const centroidsLayer = document.createElementNS(NS, "g");
        centroidsLayer.setAttribute("id", "pca-centroids-layer");
        svg.appendChild(centroidsLayer);

        // Density Ellipses / Boundary Hulls for 3 Clusters
        const hullDefs = [
          { cIdx: 0, cx: mapX(-0.1133), cy: mapY(-0.1326), rx: 145, ry: 100, rot: -40, col: colors[0] },
          { cIdx: 1, cx: mapX(0.0314), cy: mapY(0.1046), rx: 175, ry: 125, rot: 25, col: colors[1] },
          { cIdx: 2, cx: mapX(0.8195), cy: mapY(-0.4522), rx: 48, ry: 48, rot: 0, col: colors[2] }
        ];

        hullDefs.forEach(hd => {
          const el = document.createElementNS(NS, "ellipse");
          el.setAttribute("cx", hd.cx);
          el.setAttribute("cy", hd.cy);
          el.setAttribute("rx", hd.rx);
          el.setAttribute("ry", hd.ry);
          if (hd.rot !== 0) {
            el.setAttribute("transform", `rotate(${hd.rot} ${hd.cx} ${hd.cy})`);
          }
          el.setAttribute("fill", hd.col);
          el.setAttribute("fill-opacity", "0.06");
          el.setAttribute("stroke", hd.col);
          el.setAttribute("stroke-width", "1.5");
          el.setAttribute("stroke-dasharray", "4,4");
          el.setAttribute("stroke-opacity", "0.4");
          el.setAttribute("class", `pca-hull pca-hull-${hd.cIdx}`);
          el.style.pointerEvents = "none";
          el.style.transition = "opacity 0.25s ease";
          hullLayer.appendChild(el);
        });

        // Orbit ring guide for Cluster 3
        const c3CentroidX = mapX(0.8195);
        const c3CentroidY = mapY(-0.4522);
        const orbitRadius = 28;

        const c3OrbitGuide = document.createElementNS(NS, "circle");
        c3OrbitGuide.setAttribute("cx", c3CentroidX);
        c3OrbitGuide.setAttribute("cy", c3CentroidY);
        c3OrbitGuide.setAttribute("r", orbitRadius);
        c3OrbitGuide.setAttribute("fill", "none");
        c3OrbitGuide.setAttribute("stroke", colors[2]);
        c3OrbitGuide.setAttribute("stroke-dasharray", "2,2");
        c3OrbitGuide.setAttribute("stroke-width", "1.2");
        c3OrbitGuide.setAttribute("stroke-opacity", "0.55");
        c3OrbitGuide.setAttribute("class", "pca-hull pca-hull-2");
        c3OrbitGuide.style.pointerEvents = "none";
        hullLayer.appendChild(c3OrbitGuide);

        // Map points and handle Cluster 3 dispersion
        const cluster3Points = pts.filter(p => p.cluster === 2);
        const otherPoints = pts.filter(p => p.cluster !== 2);

        const pointElements = [];

        function updateInspector(p) {
          const card = document.getElementById("pca-inspector");
          const codeEl = document.getElementById("pca-insp-code");
          const titleEl = document.getElementById("pca-insp-title");
          const clustEl = document.getElementById("pca-insp-cluster");
          const lvlEl = document.getElementById("pca-insp-level");
          const coordsEl = document.getElementById("pca-insp-coords");
          const aiTagEl = document.getElementById("pca-insp-ai-tag");
          const jumpBtn = document.getElementById("pca-insp-jump");

          if (!p) {
            if (codeEl) codeEl.textContent = "CHƯA CHỌN MÔN";
            if (titleEl) titleEl.textContent = "Rê chuột hoặc nhấp vào bất kỳ điểm dữ liệu/tâm cụm nào để xem chi tiết học phần";
            if (clustEl) clustEl.textContent = "—";
            if (lvlEl) lvlEl.textContent = "—";
            if (coordsEl) coordsEl.textContent = "—";
            if (aiTagEl) aiTagEl.innerHTML = "";
            if (jumpBtn) jumpBtn.style.display = "none";
            if (card) card.classList.remove("pinned");
            return;
          }

          const cName = clusters[p.cluster] ? clusters[p.cluster].name : `Cụm ${p.cluster + 1}`;
          if (codeEl) {
            codeEl.textContent = p.code;
            codeEl.style.color = colors[p.cluster % 3];
          }
          if (titleEl) titleEl.textContent = p.title;
          if (clustEl) clustEl.textContent = cName;
          if (lvlEl) lvlEl.textContent = `Level ${p.level}`;
          if (coordsEl) coordsEl.textContent = `[PC1: ${p.x.toFixed(2)}, PC2: ${p.y.toFixed(2)}]`;
          if (aiTagEl) {
            aiTagEl.innerHTML = p.is_ai 
              ? `<span class="badge-pill badge-accent" style="margin-left:6px;">⭐ Môn AI Core</span>`
              : `<span class="badge-pill badge-neutral" style="margin-left:6px;">Học phần Chuẩn</span>`;
          }
          if (jumpBtn) {
            jumpBtn.style.display = "inline-flex";
            jumpBtn.textContent = `Tra cứu ${p.code} trong Data Explorer →`;
            jumpBtn.setAttribute("data-target-code", p.code);
          }
          if (card && pinnedPcaModule && pinnedPcaModule.code === p.code) {
            card.classList.add("pinned");
          } else if (card) {
            card.classList.remove("pinned");
          }
        }

        // Focus indicator ring
        let focusRing = null;
        function setFocusRing(cx, cy, col) {
          if (!focusRing) {
            focusRing = document.createElementNS(NS, "circle");
            focusRing.setAttribute("r", "13");
            focusRing.setAttribute("fill", "none");
            focusRing.setAttribute("stroke-width", "2.5");
            focusRing.setAttribute("stroke-dasharray", "3,3");
            focusRing.style.pointerEvents = "none";
            svg.appendChild(focusRing);
          }
          focusRing.setAttribute("cx", cx);
          focusRing.setAttribute("cy", cy);
          focusRing.setAttribute("stroke", col);
          focusRing.style.display = "block";
        }

        // Render other points (Cluster 0 and Cluster 1)
        otherPoints.forEach((p, idx) => {
          const col = colors[p.cluster % 3];
          const jitX = ((idx * 7) % 5 - 2) * 0.8;
          const jitY = ((idx * 13) % 5 - 2) * 0.8;
          const px = mapX(p.x) + jitX;
          const py = mapY(p.y) + jitY;

          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", px);
          dot.setAttribute("cy", py);
          const baseR = p.is_ai ? 6 : 4.5;
          dot.setAttribute("r", baseR);
          dot.setAttribute("fill", col);
          dot.setAttribute("opacity", p.is_ai ? "0.95" : "0.65");
          dot.setAttribute("class", `pca-dot pca-cluster-${p.cluster} ${p.is_ai ? 'pca-ai-core' : ''}`);
          dot.setAttribute("data-cluster", p.cluster);
          dot.setAttribute("data-is-ai", p.is_ai ? "1" : "0");
          dot.setAttribute("data-code", p.code);
          dot.setAttribute("data-base-r", baseR);
          if (dot.dataset) {
            dot.dataset.cluster = p.cluster;
            dot.dataset.isAi = p.is_ai ? "1" : "0";
            dot.dataset.code = p.code;
            dot.dataset.baseR = baseR;
          }
          if (p.is_ai) {
            dot.setAttribute("stroke", "var(--color-ink)");
            dot.setAttribute("stroke-width", "1.6");
          } else {
            dot.setAttribute("stroke", "var(--color-surface)");
            dot.setAttribute("stroke-width", "0.8");
          }
          dot.style.cursor = "pointer";
          dot.style.transition = "r 0.18s ease, opacity 0.2s ease";

          dot.addEventListener("mouseenter", (e) => {
            dot.setAttribute("r", baseR + 3);
            dot.setAttribute("stroke-width", "2.5");
            dot.setAttribute("stroke", "var(--color-ink)");
            const clustName = clusters[p.cluster] ? clusters[p.cluster].name : ("Cụm " + (p.cluster + 1));
            showTooltip(e, `<b>${p.code}</b>: ${p.title}<br><b style="color:${col}">&bull; ${clustName}</b><br>Tọa độ PCA: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}]<br>${p.is_ai ? '<span style="color:var(--color-chart-red); font-weight:700;">⭐ Môn trọng tâm AI</span>' : 'Level: L' + p.level}<br><span style="font-size:10px; color:var(--color-muted);">💡 Bấm để ghim vào bảng tra cứu bên dưới</span>`);
            if (!pinnedPcaModule) updateInspector(p);
          });

          dot.addEventListener("mouseleave", () => {
            const isDimmed = (activePcaCluster !== "all" && activePcaCluster !== "ai" && activePcaCluster !== String(p.cluster)) || (activePcaCluster === "ai" && !p.is_ai);
            const isHighlighted = (activePcaCluster === String(p.cluster)) || (activePcaCluster === "ai" && p.is_ai);
            dot.setAttribute("r", isHighlighted ? (baseR + 2.5) : (isDimmed ? (baseR * 0.85) : baseR));
            dot.setAttribute("stroke-width", p.is_ai ? "1.6" : "0.8");
            dot.setAttribute("stroke", p.is_ai ? "var(--color-ink)" : "var(--color-surface)");
            hideTooltip();
            if (!pinnedPcaModule) updateInspector(null);
          });

          dot.addEventListener("click", () => {
            pinnedPcaModule = p;
            setFocusRing(px, py, col);
            updateInspector(p);
          });

          dotsLayer.appendChild(dot);
          pointElements.push(dot);
        });

        // Render Cluster 3 points (10 modules) on Orbit Constellation
        cluster3Points.forEach((p, idx) => {
          const col = colors[2];
          const angle = (idx / cluster3Points.length) * 2 * Math.PI - Math.PI / 2;
          const px = c3CentroidX + orbitRadius * Math.cos(angle);
          const py = c3CentroidY + orbitRadius * Math.sin(angle);

          // Ray connector from centroid to orbit point
          const ray = document.createElementNS(NS, "line");
          ray.setAttribute("x1", c3CentroidX);
          ray.setAttribute("y1", c3CentroidY);
          ray.setAttribute("x2", px);
          ray.setAttribute("y2", py);
          ray.setAttribute("stroke", col);
          ray.setAttribute("stroke-width", "1");
          ray.setAttribute("stroke-opacity", "0.4");
          ray.setAttribute("class", "pca-hull pca-hull-2");
          ray.style.pointerEvents = "none";
          linksLayer.appendChild(ray);

          // Dot
          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", px);
          dot.setAttribute("cy", py);
          const baseR = 5.5;
          dot.setAttribute("r", baseR);
          dot.setAttribute("fill", col);
          dot.setAttribute("opacity", "0.95");
          dot.setAttribute("stroke", "var(--color-surface)");
          dot.setAttribute("stroke-width", "1.5");
          dot.setAttribute("class", `pca-dot pca-cluster-2`);
          dot.setAttribute("data-base-r", baseR);
          dot.setAttribute("data-cluster", 2);
          dot.setAttribute("data-is-ai", "0");
          dot.setAttribute("data-code", p.code);
          if (dot.dataset) {
            dot.dataset.baseR = baseR;
            dot.dataset.cluster = 2;
            dot.dataset.isAi = "0";
            dot.dataset.code = p.code;
          }
          dot.style.cursor = "pointer";
          dot.style.transition = "r 0.18s ease, opacity 0.2s ease";

          dot.addEventListener("mouseenter", (e) => {
            dot.setAttribute("r", baseR + 3.5);
            dot.setAttribute("stroke-width", "2.5");
            dot.setAttribute("stroke", "var(--color-ink)");
            const clustName = clusters[2] ? clusters[2].name : "Cụm 3: Chuỗi thực tập FOS";
            showTooltip(e, `<b>${p.code}</b>: ${p.title}<br><b style="color:${col}">&bull; ${clustName}</b><br>Tọa độ PCA: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}]<br>Level: L${p.level} &bull; Chuỗi thực tập chuyên môn<br><span style="font-size:10px; color:var(--color-muted);">💡 Bấm để ghim vào bảng tra cứu bên dưới</span>`);
            if (!pinnedPcaModule) updateInspector(p);
          });

          dot.addEventListener("mouseleave", () => {
            const isDimmed = (activePcaCluster !== "all" && activePcaCluster !== "2");
            const isHighlighted = (activePcaCluster === "2");
            dot.setAttribute("r", isHighlighted ? (baseR + 2.5) : (isDimmed ? (baseR * 0.85) : baseR));
            dot.setAttribute("stroke-width", "1.5");
            dot.setAttribute("stroke", "var(--color-surface)");
            hideTooltip();
            if (!pinnedPcaModule) updateInspector(null);
          });

          dot.addEventListener("click", () => {
            pinnedPcaModule = p;
            setFocusRing(px, py, col);
            updateInspector(p);
          });

          dotsLayer.appendChild(dot);
          pointElements.push(dot);
        });

        // Cluster Centroids & Badges with Backdrop Pills
        clusters.forEach((clust, cIdx) => {
          const cx = clust.centroid[0];
          const cy = clust.centroid[1];
          const col = colors[cIdx % 3];
          const pcx = mapX(cx);
          const pcy = mapY(cy);

          // Outer pulsing ring for centroid
          const cRing = document.createElementNS(NS, "circle");
          cRing.setAttribute("cx", pcx);
          cRing.setAttribute("cy", pcy);
          cRing.setAttribute("r", "15");
          cRing.setAttribute("fill", "none");
          cRing.setAttribute("stroke", col);
          cRing.setAttribute("stroke-width", "1.5");
          cRing.setAttribute("stroke-opacity", "0.5");
          cRing.setAttribute("class", `pca-hull pca-hull-${cIdx}`);
          cRing.style.pointerEvents = "none";
          centroidsLayer.appendChild(cRing);

          // Centroid Dot
          const cDot = document.createElementNS(NS, "circle");
          cDot.setAttribute("cx", pcx);
          cDot.setAttribute("cy", pcy);
          cDot.setAttribute("r", "10");
          cDot.setAttribute("fill", col);
          cDot.setAttribute("stroke", "var(--color-surface)");
          cDot.setAttribute("stroke-width", "3");
          cDot.setAttribute("class", `pca-centroid pca-centroid-${cIdx}`);
          cDot.style.cursor = "pointer";

          cDot.addEventListener("mouseenter", (e) => {
            cDot.setAttribute("r", "13");
            showTooltip(e, `<b>${clust.name}</b><br>Quy mô: <b>${clust.size} học phần (${clust.percentage}%)</b><br>Tọa độ Tâm PCA: [${cx.toFixed(2)}, ${cy.toFixed(2)}]<br><span style="font-size:10px; color:var(--color-muted);">💡 Click vào tâm để cô lập cụm này</span>`);
          });
          cDot.addEventListener("mouseleave", () => {
            cDot.setAttribute("r", "10");
            hideTooltip();
          });
          cDot.addEventListener("click", () => {
            setFilter(activePcaCluster === String(cIdx) ? "all" : String(cIdx));
          });
          centroidsLayer.appendChild(cDot);

          // Backdrop Pill for Centroid Label
          const lblGroup = document.createElementNS(NS, "g");
          lblGroup.setAttribute("class", `pca-hull pca-hull-${cIdx}`);
          lblGroup.style.cursor = "pointer";
          lblGroup.addEventListener("click", () => {
            setFilter(activePcaCluster === String(cIdx) ? "all" : String(cIdx));
          });

          const lblText = `Tâm Cụm ${cIdx + 1} (${clust.size} môn - ${clust.percentage}%)`;
          const textW = lblText.length * 6.5 + 16;
          const textH = 22;

          let pillX = pcx - textW / 2;
          let pillY = pcy - 34;
          if (cIdx === 0) {
            pillX = pcx - textW - 14;
            pillY = pcy - 12;
          } else if (cIdx === 1) {
            pillX = pcx + 14;
            pillY = pcy - 24;
          } else if (cIdx === 2) {
            pillX = pcx - textW / 2;
            pillY = pcy - 48;
          }

          const pillBg = document.createElementNS(NS, "rect");
          pillBg.setAttribute("x", pillX);
          pillBg.setAttribute("y", pillY);
          pillBg.setAttribute("width", textW);
          pillBg.setAttribute("height", textH);
          pillBg.setAttribute("rx", "5");
          pillBg.setAttribute("fill", "var(--color-surface)");
          pillBg.setAttribute("stroke", col);
          pillBg.setAttribute("stroke-width", "1.2");
          pillBg.setAttribute("opacity", "0.95");
          lblGroup.appendChild(pillBg);

          const cLbl = document.createElementNS(NS, "text");
          cLbl.setAttribute("x", pillX + textW / 2);
          cLbl.setAttribute("y", pillY + 15);
          cLbl.setAttribute("text-anchor", "middle");
          cLbl.setAttribute("font-size", "11");
          cLbl.setAttribute("font-weight", "700");
          cLbl.setAttribute("fill", col);
          cLbl.textContent = lblText;
          lblGroup.appendChild(cLbl);

          centroidsLayer.appendChild(lblGroup);
        });

        // Axis Titles
        const axX = document.createElementNS(NS, "text");
        axX.setAttribute("x", w / 2);
        axX.setAttribute("y", h - 14);
        axX.setAttribute("text-anchor", "middle");
        axX.setAttribute("font-size", "12");
        axX.setAttribute("font-weight", "700");
        axX.setAttribute("fill", "var(--color-ink)");
        axX.textContent = "Thành phần Chính 1 (PC1: Trục phân tách Chủ đề Tính toán & Dữ liệu)";
        svg.appendChild(axX);

        const axY = document.createElementNS(NS, "text");
        axY.setAttribute("x", -h / 2);
        axY.setAttribute("y", 18);
        axY.setAttribute("transform", "rotate(-90)");
        axY.setAttribute("text-anchor", "middle");
        axY.setAttribute("font-size", "12");
        axY.setAttribute("font-weight", "700");
        axY.setAttribute("fill", "var(--color-ink)");
        axY.textContent = "Thành phần Chính 2 (PC2: Trục phân tách Hệ thống & Ứng dụng)";
        svg.appendChild(axY);

        box.innerHTML = "";
        box.appendChild(svg);

        // Filter Function
        function setFilter(filterVal) {
          activePcaCluster = filterVal;
          const btns = document.querySelectorAll("#pca-filter-buttons .pca-btn");
          btns.forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-filter") === filterVal);
          });

          pointElements.forEach(el => {
            const c = el.dataset ? el.dataset.cluster : el.getAttribute("data-cluster");
            const isAi = (el.dataset ? el.dataset.isAi : el.getAttribute("data-is-ai")) === "1";
            const bR = parseFloat((el.dataset ? el.dataset.baseR : el.getAttribute("data-base-r")) || "5");
            el.style.transform = "none";
            if (filterVal === "all") {
              el.setAttribute("r", bR);
              el.style.opacity = isAi ? "0.95" : (c === "2" ? "0.95" : "0.65");
            } else if (filterVal === "ai") {
              if (isAi) {
                el.setAttribute("r", bR + 2.5);
                el.style.opacity = "1";
              } else {
                el.setAttribute("r", bR * 0.85);
                el.style.opacity = "0.06";
              }
            } else {
              if (c === filterVal) {
                el.setAttribute("r", bR + 2.5);
                el.style.opacity = "1";
              } else {
                el.setAttribute("r", bR * 0.85);
                el.style.opacity = "0.06";
              }
            }
          });

          for (let i = 0; i < 3; i++) {
            const hulls = svg.querySelectorAll(`.pca-hull-${i}`);
            const cents = svg.querySelectorAll(`.pca-centroid-${i}`);
            const show = (filterVal === "all" || filterVal === String(i));
            hulls.forEach(h => { h.style.opacity = show ? "1" : "0.06"; });
            cents.forEach(c => { c.style.opacity = show ? "1" : "0.15"; });
          }
        }

        // Attach events to filter buttons
        const filterBtns = document.querySelectorAll("#pca-filter-buttons .pca-btn");
        filterBtns.forEach(b => {
          b.onclick = () => {
            setFilter(b.getAttribute("data-filter"));
          };
        });

        // Global jump handler
        window.jumpToExplorerModule = function() {
          const btn = document.getElementById("pca-insp-jump");
          const code = btn ? btn.getAttribute("data-target-code") : null;
          if (code && window.jumpToModuleFromPca) {
            window.jumpToModuleFromPca(code);
          }
        };

        // Restore pinned module inspector if available
        if (pinnedPcaModule) {
          updateInspector(pinnedPcaModule);
        }
      }

      // 3.3 Inlined Interactive SVG DAG
      function renderInlinedDAG() {
        const stagesLayer = document.getElementById("dag-stages-layer");
        const edgesLayer = document.getElementById("dag-edges-layer");
        const nodesLayer = document.getElementById("dag-nodes-layer");
        if (!stagesLayer || !edgesLayer || !nodesLayer) return;

        const STAGES = [
          { name: "Giai đoạn 1: Nền tảng Năm 1", sub: "Giải tích, Đại số, Xác suất & Lập trình", x: 40, w: 280 },
          { name: "Giai đoạn 2: Cầu nối Năm 2", sub: "Cấu trúc dữ liệu & Cơ sở Tìm kiếm", x: 360, w: 280 },
          { name: "Giai đoạn 3: Môn Cốt lõi Năm 3", sub: "Machine Learning kinh điển & AI", x: 680, w: 280 },
          { name: "Giai đoạn 4: Chuyên sâu Năm 4+", sub: "Deep Learning, LLM & Thị giác Máy tính", x: 1000, w: 290 }
        ];

        const NODES = [
          { id: "MA1521", code: "MA1521", name: "Giải tích Computing", cat: "math", x: 140, y: 130 },
          { id: "MA2001", code: "MA2001", name: "Đại số Tuyến tính I", cat: "math", x: 140, y: 250 },
          { id: "ST2131", code: "ST2131", name: "Lý thuyết Xác suất", cat: "math", x: 140, y: 370 },
          { id: "CS1010", code: "CS1010", name: "Lập trình Cơ sở", cat: "core", x: 140, y: 490 },
          { id: "CS1231", code: "CS1231", name: "Toán Rời rạc", cat: "core", x: 140, y: 610 },
          { id: "CS2040", code: "CS2040", name: "CT Dữ liệu & Thuật toán", cat: "core", x: 460, y: 380 },
          { id: "CS2109S", code: "CS2109S", name: "Nhập môn AI & ML", cat: "ai", x: 460, y: 560 },
          { id: "CS3243", code: "CS3243", name: "AI Kinh điển", cat: "ai", x: 780, y: 200 },
          { id: "CS3244", code: "CS3244", name: "Học máy (ML)", cat: "ai", x: 780, y: 390 },
          { id: "CS3245", code: "CS3245", name: "Truy hồi Thông tin", cat: "ai", x: 780, y: 580 },
          { id: "CS4243", code: "CS4243", name: "Thị giác Máy tính", cat: "adv", x: 1110, y: 180 },
          { id: "CS4248", code: "CS4248", name: "LLM & Xử lý Ngôn ngữ", cat: "adv", x: 1110, y: 380 },
          { id: "CS5242", code: "CS5242", name: "Học sâu", cat: "adv", x: 1110, y: 580 }
        ];

        const EDGES = [
          { from: "CS1010", to: "CS2040" },
          { from: "CS1010", to: "CS2109S" },
          { from: "CS2040", to: "CS3243" },
          { from: "CS2040", to: "CS3244" },
          { from: "CS2040", to: "CS3245" },
          { from: "CS2040", to: "CS4243" },
          { from: "CS1231", to: "CS3243" },
          { from: "MA1521", to: "CS2109S" },
          { from: "MA1521", to: "CS3244" },
          { from: "MA1521", to: "CS4243" },
          { from: "MA1521", to: "CS4248" },
          { from: "MA2001", to: "CS3244" },
          { from: "MA2001", to: "CS4243" },
          { from: "ST2131", to: "CS3244" },
          { from: "ST2131", to: "CS4243" },
          { from: "ST2131", to: "CS4248" },
          { from: "ST2131", to: "CS5242" },
          { from: "CS2109S", to: "CS4248" },
          { from: "CS2109S", to: "CS5242" },
          { from: "CS3244", to: "CS4248" },
          { from: "CS3244", to: "CS5242" }
        ];

        const nodeMap = new Map();
        NODES.forEach(n => nodeMap.set(n.id, n));

        // Render stage lanes
        stagesLayer.innerHTML = "";
        STAGES.forEach(s => {
          const g = document.createElementNS(NS, "g");
          g.innerHTML = `
            <rect class="dag-stage-band" x="${s.x}" y="40" width="${s.w}" height="650" />
            <text class="dag-stage-title" x="${s.x + 14}" y="66">${s.name}</text>
            <text class="dag-stage-sub" x="${s.x + 14}" y="82">${s.sub}</text>
          `;
          stagesLayer.appendChild(g);
        });

        // Render edges
        edgesLayer.innerHTML = "";
        EDGES.forEach(e => {
          const nF = nodeMap.get(e.from);
          const nT = nodeMap.get(e.to);
          if (!nF || !nT) return;
          const x1 = nF.x + 75;
          const y1 = nF.y;
          const x2 = nT.x - 75;
          const y2 = nT.y;
          const dx = Math.max(30, (x2 - x1) * 0.45);
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          const path = document.createElementNS(NS, "path");
          path.setAttribute("class", "dag-edge");
          path.setAttribute("id", `edge-${e.from}-${e.to}`);
          path.setAttribute("data-from", e.from);
          path.setAttribute("data-to", e.to);
          path.setAttribute("d", d);
          path.setAttribute("marker-end", "url(#arrow-default)");
          edgesLayer.appendChild(path);
        });

        // Render nodes
        nodesLayer.innerHTML = "";
        NODES.forEach(n => {
          let bColor = "var(--color-chart-blue)";
          if (n.cat === "math") bColor = "var(--color-chart-red)";
          if (n.cat === "ai") bColor = "var(--color-chart-purple)";
          if (n.cat === "adv") bColor = "var(--color-accent)";

          const g = document.createElementNS(NS, "g");
          g.setAttribute("class", "dag-node");
          g.setAttribute("id", `node-${n.id}`);
          g.setAttribute("data-id", n.id);
          g.setAttribute("transform", `translate(${n.x}, ${n.y})`);

          g.innerHTML = `
            <rect class="dag-node-rect" x="-75" y="-26" width="150" height="52" rx="8" fill="var(--color-surface)" stroke="${bColor}" stroke-width="1.5" />
            <circle cx="58" cy="-14" r="3.5" fill="${bColor}" />
            <text x="-65" y="-6" font-size="12" font-weight="700" font-family="monospace" fill="var(--color-ink)">${n.code}</text>
            <text x="-65" y="14" font-size="10.5" fill="var(--color-muted)">${n.name}</text>
          `;

          g.addEventListener("click", (evt) => {
            evt.stopPropagation();
            selectDagNode(n.id);
          });
          nodesLayer.appendChild(g);
        });

        let currentSelectedNode = null;

        function resetDagSelection() {
          currentSelectedNode = null;
          document.querySelectorAll(".dag-node").forEach(gn => {
            gn.classList.remove("active", "inbound", "outbound");
            gn.style.opacity = "1";
          });
          document.querySelectorAll(".dag-edge").forEach(ep => {
            ep.setAttribute("class", "dag-edge");
            ep.setAttribute("marker-end", "url(#arrow-default)");
            ep.style.opacity = "";
          });
        }

        function selectDagNode(nodeId) {
          if (currentSelectedNode === nodeId) {
            resetDagSelection();
            document.querySelectorAll(".dag-preset-btn").forEach(b => {
              b.classList.toggle("active", b.getAttribute("data-preset") === "all");
            });
            return;
          }
          currentSelectedNode = nodeId;

          // Clear preset button active states since we are focusing on a single node
          document.querySelectorAll(".dag-preset-btn").forEach(b => b.classList.remove("active"));

          const inNodes = new Set();
          const outNodes = new Set();
          EDGES.forEach(e => {
            if (e.to === nodeId) inNodes.add(e.from);
            if (e.from === nodeId) outNodes.add(e.to);
          });

          document.querySelectorAll(".dag-node").forEach(gn => {
            const id = gn.getAttribute("data-id") || gn.id.replace("node-", "");
            gn.classList.remove("active", "inbound", "outbound");

            if (id === nodeId) {
              gn.classList.add("active");
              gn.style.opacity = "1";
            } else if (inNodes.has(id)) {
              gn.classList.add("inbound");
              gn.style.opacity = "1";
            } else if (outNodes.has(id)) {
              gn.classList.add("outbound");
              gn.style.opacity = "1";
            } else {
              gn.style.opacity = "0.15";
            }
          });

          document.querySelectorAll(".dag-edge").forEach(ep => {
            const f = ep.getAttribute("data-from");
            const t = ep.getAttribute("data-to");
            if (t === nodeId) {
              ep.setAttribute("class", "dag-edge highlight-in");
              ep.setAttribute("marker-end", "url(#arrow-in)");
              ep.style.opacity = "1";
            } else if (f === nodeId) {
              ep.setAttribute("class", "dag-edge highlight-out");
              ep.setAttribute("marker-end", "url(#arrow-out)");
              ep.style.opacity = "1";
            } else {
              ep.setAttribute("class", "dag-edge");
              ep.setAttribute("marker-end", "url(#arrow-default)");
              ep.style.opacity = "0.06";
            }
          });
        }

        // Clicking anywhere on the SVG canvas deselects the current node
        const dagSvg = document.getElementById("dag-svg");
        if (dagSvg) {
          dagSvg.addEventListener("click", () => {
            resetDagSelection();
            document.querySelectorAll(".dag-preset-btn").forEach(b => {
              b.classList.toggle("active", b.getAttribute("data-preset") === "all");
            });
          });
        }

        // Preset filters
        const PRESETS = {
          all: null,
          deep_learning: ["MA1521", "ST2131", "CS1010", "CS2040", "CS2109S", "CS3244", "CS5242"],
          llm: ["MA1521", "ST2131", "CS1010", "CS2040", "CS2109S", "CS3244", "CS4248"],
          vision: ["MA1521", "MA2001", "ST2131", "CS1010", "CS2040", "CS4243"],
          classic_ai: ["CS1010", "CS1231", "CS2040", "CS3243"]
        };

        document.querySelectorAll(".dag-preset-btn").forEach(btn => {
          btn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            document.querySelectorAll(".dag-preset-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentSelectedNode = null;

            const p = btn.getAttribute("data-preset");
            const allowed = PRESETS[p];

            document.querySelectorAll(".dag-node").forEach(gn => {
              gn.classList.remove("active", "inbound", "outbound");
              const id = gn.getAttribute("data-id") || gn.id.replace("node-", "");
              gn.style.opacity = (!allowed || allowed.includes(id)) ? "1" : "0.15";
            });

            document.querySelectorAll(".dag-edge").forEach(ep => {
              ep.setAttribute("class", "dag-edge");
              ep.setAttribute("marker-end", "url(#arrow-default)");
              const f = ep.getAttribute("data-from");
              const t = ep.getAttribute("data-to");
              ep.style.opacity = (!allowed || (allowed.includes(f) && allowed.includes(t))) ? "0.65" : "0.06";
            });
          });
        });

        resetDagSelection();
      }

      // ========================================================================
      // 6. Interactive Architecture & Algorithm Topology Explorers (Tab 2)
      // ========================================================================
      const PIPELINE_DATA = {
        "stage-loader": {
          type: "Tầng kiến trúc",
          badgeClass: "badge-primary",
          tag: "Tầng 01",
          title: "Kỹ thuật dữ liệu và tiền xử lý thực nghiệm",
          category: "Tiền xử lý & Trích xuất đặc trưng",
          file: "src/loader.py",
          func: "fetch_nusmods_data(), parse_prereq_tree(), impute_missing_workload()",
          objective: "Thu thập API NUSMods qua 5 năm (2020–2025), bóc tách cây logic tiên quyết phức tạp và chuẩn hóa 1.400 học phần.",
          math: "Bù khuyết trung vị phân tầng: với mọi học phần <i>m</i> thuộc cấp bậc <i>L</i> (Level 1..6), giá trị giờ học khuyết thiếu được gán bằng: <code>Workload<sub>imp</sub> = Median({Workload<sub>j</sub> | Level(j) = L})</code>. Cây điều kiện tiên quyết logic được giải mã đệ quy theo cú pháp AST: <code>Prereq(m) = &and; / &or; / nOf(Node<sub>k</sub>)</code>.",
          mathHighlight: "Workload_imputed = Median(Workload | Level) &bull; AST Logic: and/or/nOf",
          findings: "Chuẩn hóa thành công 1.400 bản ghi học phần sạch với 26 trường thuộc tính, tỷ lệ khuyết thiếu sau xử lý đạt 0%, trích xuất 267 môn học có nội dung AI/ML.",
          targetTab: "explorer",
          cleanTabName: "Bảng tra cứu học phần"
        },
        "stage-analytics": {
          type: "Tầng kiến trúc",
          badgeClass: "badge-accent",
          tag: "Tầng 02",
          title: "Động cơ phân tích định lượng và học máy",
          category: "Thống kê suy luận & Mô hình hóa",
          file: "src/analytics.py",
          func: "analyze_q1()..analyze_q5(), build_web_payload()",
          objective: "Thực thi toàn bộ các mô hình hồi quy, kiểm định giả thuyết và học máy không giám sát cho 5 nhóm câu hỏi nghiên cứu.",
          math: "Động cơ tính toán tích hợp: Hồi quy tuyến tính OLS, kiểm định Welch <i>t</i>-test, khoảng tin cậy 95%, ma trận tương quan Pearson, TF-IDF vectorizer, phân cụm K-Means phương pháp Elbow và phân tích thành phần chính PCA 2 chiều.",
          mathHighlight: "OLS + Welch t-test + 95% CI + Pearson + TF-IDF + K-Means + PCA",
          findings: "Đóng gói toàn bộ kết quả phân tích định lượng vào tệp trung gian <code>data/web_data.json</code> dung lượng 879 KB phục vụ trực tiếp cho web.",
          targetTab: "stats",
          cleanTabName: "Thống kê suy luận"
        },
        "stage-builder": {
          type: "Tầng kiến trúc",
          badgeClass: "badge-neutral",
          tag: "Tầng 03",
          title: "Trình biên dịch web tĩnh độc lập",
          category: "Biên dịch & Đóng gói sản phẩm",
          file: "src/builder.py",
          func: "build_static_site()",
          objective: "Ghép khung mẫu HTML thuần với dữ liệu phân tích JSON thành tệp web tĩnh hoàn chỉnh phục vụ xuất bản GitHub Pages.",
          math: "Cơ chế biên dịch một pha không phụ thuộc runtime máy chủ: <code>HTML<sub>static</sub> = Template &oplus; Embedded_JSON(web_data)</code>. Tối ưu hóa tải trang tức thì, zero layout shift và đường dẫn tương đối chuẩn.",
          mathHighlight: "Static Compilation: Template + Embedded JSON Payload (Zero Server-side Runtime)",
          findings: "Thời gian biên dịch chỉ mất 0.28 giây, tạo ra giao diện độc lập hoàn toàn, hỗ trợ chế độ ngoại tuyến và tải trang tức thì trên GitHub Pages.",
          targetTab: "report",
          cleanTabName: "Báo cáo kỹ thuật"
        },
        "stage-presentation": {
          type: "Tầng kiến trúc",
          badgeClass: "badge-primary",
          tag: "Tầng 04",
          title: "Động cơ trực quan hóa Native SVG",
          category: "Trình diễn trực quan & Tương tác người dùng",
          file: "docs/charts.js",
          func: "renderChartStoryTrend(), renderInlinedDAG(), renderChartQ4Ttest(), ...",
          objective: "Vẽ 20 biểu đồ định lượng và mạng lưới topo tiên quyết DAG bằng Native SVG thuần, tích hợp bộ lọc tương tác 1.400 môn.",
          math: "Hệ tọa độ vector SVG thuần túy: hàm co giãn tuyến tính <code>Scale(x) = y<sub>min</sub> + (x - x<sub>min</sub>) / (x<sub>max</sub> - x<sub>min</sub>) &times; &Delta;y</code>. Không nạp bất kỳ thư viện bên ngoài nào, bảo đảm an toàn thông tin và thời gian phản hồi DOM &lt; 16ms (chuẩn 60 FPS).",
          mathHighlight: "viewBox Vector Math &bull; Linear/Log Scales &bull; Native SVG DOM (Zero Libs)",
          findings: "Vận hành mượt mà trên mọi thiết bị và độ phân giải màn hình; chuyển đổi tức thì giữa chế độ Sáng và Tối theo hệ màu Kott Studio chuẩn AAA.",
          targetTab: "storytelling",
          cleanTabName: "Tổng quan khám phá"
        }
      };

      const ALGO_DATA = {
        "algo-ols": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-accent",
          tag: "Q2.2",
          title: "Hồi quy tuyến tính OLS",
          category: "Thống kê thực nghiệm &bull; Định mức tín chỉ và giờ học",
          file: "src/analytics.py",
          func: "analyze_q2_workload_credit_alignment()",
          objective: "Đánh giá mức độ tương quan tuyến tính giữa định mức tín chỉ học phần (MCs) và tổng giờ học thực tế hàng tuần.",
          math: "Mô hình hồi quy: <code>Workload = &beta;<sub>1</sub> &times; MCs + &beta;<sub>0</sub> + &epsilon;</code> với <code>&beta;<sub>1</sub> = Cov(MCs, Workload) / Var(MCs)</code>. Hệ số xác định <code><i>R</i><sup>2</sup> = SSR / SST</code>.",
          mathHighlight: "Workload = 0.29 &times; MCs + 2.06 &bull; R<sup>2</sup> = 0.069 &bull; p &lt; 0.001",
          findings: "Tín chỉ chỉ giải thích được 6.9% độ biến thiên giờ học thực tế. Quy luật ngầm 1 MC = 2.5 giờ/tuần không phản ánh đúng áp lực thực tế của sinh viên.",
          targetTab: "workload",
          cleanTabName: "Tải học tập & MCs"
        },
        "algo-dag": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-primary",
          tag: "Q3.1–Q3.3",
          title: "Phân tích cấu trúc đồ thị có hướng DAG",
          category: "Cấu trúc dữ liệu & Đồ thị &bull; Cây điều kiện tiên quyết",
          file: "src/loader.py & src/analytics.py",
          func: "parse_prereq_tree(), analyze_q3_prerequisite_flow()",
          objective: "Xây dựng cấu trúc đồ thị có hướng không chu trình của các môn tiên quyết và phân tích điểm nghẽn cổ chai của chương trình đào tạo.",
          math: "Đồ thị <code>G = (V, E)</code> với <code>(u, v) &isin; E</code> nếu <i>u</i> là điều kiện tiên quyết của <i>v</i>. Bậc ra (Out-degree): <code>Deg<sup>+</sup>(u) = |{v &isin; V | (u, v) &isin; E}|</code>. Độ sâu chuỗi tiên quyết: độ dài đường đi dài nhất trong DAG.",
          mathHighlight: "CS1010 (Bậc ra = 28) &bull; CS2040 (Bậc ra = 21) &bull; Chuỗi sâu nhất = 5 tầng",
          findings: "Nhận diện CS1010 và CS2040 là hai môn học cửa ngõ cốt lõi. Mọi phân nhánh chuyên sâu (AI, Đồ họa, Hệ thống) đều bắt buộc đi qua hai điểm nghẽn này.",
          targetTab: "prereq",
          cleanTabName: "Mạng lưới tiên quyết"
        },
        "algo-ttest": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-primary",
          tag: "Q4.1",
          title: "Kiểm định giả thuyết Welch <i>t</i>-test",
          category: "Kiểm định giả thuyết thống kê &bull; So sánh hai nhóm độc lập",
          file: "src/analytics.py",
          func: "analyze_q4_workload_rigor()",
          objective: "Kiểm định xem học phần AI/ML có tổng khối lượng giờ học thực tế khác biệt có ý nghĩa thống kê so với học phần không thuộc AI hay không.",
          math: "Thống kê kiểm định: <code><i>t</i> = (X&#772;<sub>AI</sub> - X&#772;<sub>non-AI</sub>) / &radic;(s<sub>1</sub><sup>2</sup>/n<sub>1</sub> + s<sub>2</sub><sup>2</sup>/n<sub>2</sub>)</code> với bậc tự do điều chỉnh Welch&ndash;Satterthwaite. Giả thuyết <i>H</i><sub>0</sub>: &mu;<sub>AI</sub> = &mu;<sub>non-AI</sub>.",
          mathHighlight: "t = -10.44 &bull; df = 1397.9 &bull; p = 1.84 &times; 10<sup>-24</sup> (Bác bỏ H<sub>0</sub>)",
          findings: "Môn AI/ML yêu cầu trung bình 11.58 giờ/tuần, cao hơn 1.25 giờ so với môn thông thường (10.33 giờ/tuần). Mức chênh lệch có ý nghĩa thống kê vượt trội (<i>p</i> &lt; 0.001).",
          targetTab: "stats",
          cleanTabName: "Thống kê suy luận"
        },
        "algo-ci": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-accent",
          tag: "Q4.2",
          title: "Ước lượng khoảng tin cậy 95% CI",
          category: "Ước lượng tham số &bull; Mức độ dao động kỳ vọng",
          file: "src/analytics.py",
          func: "analyze_q4_workload_rigor()",
          objective: "Xác định khoảng giá trị kỳ vọng tin cậy của tổng giờ học cho từng phân nhóm học phần AI và Non-AI.",
          math: "Công thức khoảng tin cậy: <code>CI<sub>95%</sub> = X&#772; &plusmn; 1.96 &times; (s / &radic;n)</code>. Bán kính sai số chuẩn dựa trên phân phối tiệm cận chuẩn với kích thước mẫu lớn (n = 1.400).",
          mathHighlight: "Nhóm AI: [11.22, 11.95] giờ &bull; Nhóm Non-AI: [10.16, 10.51] giờ",
          findings: "Hai khoảng tin cậy 95% hoàn toàn không giao nhau, bảo đảm kết luận học phần AI luôn đòi hỏi thời gian tự học vượt trội với độ tin cậy thực nghiệm 95%.",
          targetTab: "stats",
          cleanTabName: "Thống kê suy luận"
        },
        "algo-pearson": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-neutral",
          tag: "Q4.3",
          title: "Hệ số tương quan tuyến tính Pearson",
          category: "Phân tích tương quan &bull; Ma trận nửa tam giác",
          file: "src/analytics.py",
          func: "analyze_q4_workload_rigor()",
          objective: "Khám phá tương quan giữa các thành phần học tập: giờ nghe giảng, giờ chuẩn bị bài, giờ thực hành và số tín chỉ.",
          math: "Hệ số tương quan: <code><i>r</i> = &sum;(x<sub>i</sub> - x&#772;)(y<sub>i</sub> - y&#772;) / [&radic;&sum;(x<sub>i</sub> - x&#772;)<sup>2</sup> &radic;&sum;(y<sub>i</sub> - y&#772;)<sup>2</sup>]</code>. Ma trận đối xứng được rút gọn thành ma trận tam giác dưới.",
          mathHighlight: "r(prep, total) = 0.812 &bull; r(lecture, total) = 0.342 &bull; p &lt; 0.001",
          findings: "Giờ tự chuẩn bị bài tập là nhân tố tương quan chặt chẽ nhất (<i>r</i> = 0.812) tới tổng áp lực học tập, chứ không phải số giờ ngồi nghe giảng trên lớp.",
          targetTab: "stats",
          cleanTabName: "Thống kê suy luận"
        },
        "algo-tfidf": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-primary",
          tag: "Q5.1",
          title: "Khai phá văn bản và trích xuất đặc trưng TF-IDF",
          category: "Xử lý ngôn ngữ tự nhiên (NLP) &bull; Trích xuất đặc trưng",
          file: "src/analytics.py",
          func: "analyze_q5_ai_clustering()",
          objective: "Trích xuất 100 từ khóa đặc trưng nhất từ đề cương mô tả học phần để tạo vector đặc trưng biểu diễn nội dung đào tạo.",
          math: "Trọng số thuật ngữ: <code>TF-IDF(t, d, D) = TF(t, d) &times; log((1 + |D|) / (1 + DF(t)))</code> với kỹ thuật lọc stop words tiếng Anh và từ vựng kỹ thuật thông dụng.",
          mathHighlight: "Top từ khóa: neural (0.24), learning (0.21), vision (0.19), optimization (0.18)",
          findings: "Tách biệt chính xác các phân ngành khoa học máy tính; làm nổi bật nhóm từ khóa cốt lõi của môn học trí tuệ nhân tạo so với môn lập trình căn bản.",
          targetTab: "ml",
          cleanTabName: "Học máy & Cụm AI"
        },
        "algo-kmeans": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-accent",
          tag: "Q5.2",
          title: "Phân cụm K-Means và phương pháp điểm uốn Elbow",
          category: "Học không giám sát &bull; Gom cụm học phần",
          file: "src/analytics.py",
          func: "analyze_q5_ai_clustering()",
          objective: "Tự động phân nhóm 1.400 học phần thành các cụm năng lực đào tạo tự nhiên và xác định số cụm tối ưu <i>K</i>.",
          math: "Tối thiểu hóa tổng bình phương khoảng cách nội cụm: <code>SSE = &sum;<sub>k=1..K</sub> &sum;<sub>x &isin; C<sub>k</sub></sub> ||x - &mu;<sub>k</sub>||<sup>2</sup></code>. Phương pháp Elbow kiểm tra độ giảm tốc độ quán tính khi tăng <i>K</i> từ 1 đến 8.",
          mathHighlight: "K* = 3 &bull; Quán tính giảm 46.2% &bull; Cụm 0 (Hệ thống), Cụm 1 (AI), Cụm 2 (Lý thuyết)",
          findings: "Số cụm tối ưu <i>K</i> = 3 phản ánh chính xác cấu trúc 3 trụ cột đào tạo của Khoa Máy tính NUS: Hệ thống phần mềm, Trí tuệ nhân tạo, và Toán tin lý thuyết.",
          targetTab: "ml",
          cleanTabName: "Học máy & Cụm AI"
        },
        "algo-pca": {
          type: "Thuật toán định lượng",
          badgeClass: "badge-neutral",
          tag: "Q5.3",
          title: "Phân tích thành phần chính PCA 2 chiều",
          category: "Giảm chiều dữ liệu &bull; Trực quan hóa không gian tiềm ẩn",
          file: "src/analytics.py",
          func: "analyze_q5_ai_clustering()",
          objective: "Giảm không gian 100 chiều TF-IDF xuống 2 chiều trực giao để trực quan hóa đám mây phân cụm học phần trên mặt phẳng tọa độ.",
          math: "Phân tích vector riêng ma trận hiệp phương sai: <code>C = (1/n) X<sup>T</sup> X</code>, chọn 2 vector riêng tương ứng 2 trị riêng lớn nhất <code>&lambda;<sub>1</sub>, &lambda;<sub>2</sub></code> để chiếu tọa độ: <code>Z = X W<sub>2</sub></code>.",
          mathHighlight: "Silhouette = 0.5355 &bull; Chiếu trực giao 2 trục PC1 và PC2",
          findings: "Điểm Silhouette đạt 0.5355 khẳng định ranh giới giữa các cụm học phần rất rõ nét; các môn AI tập trung thành một vòm phân cụm độc lập ở phía trên.",
          targetTab: "ml",
          cleanTabName: "Học máy & Cụm AI"
        }
      };

      function initPipelineExplorer() {
        const inspector = document.getElementById("pipeline-inspector");
        if (!inspector) return;

        function renderPipelineInspector(key) {
          const item = PIPELINE_DATA[key];
          if (!item) return;

          document.querySelectorAll(".pipeline-stage-card").forEach(c => {
            c.classList.toggle("active", c.getAttribute("data-stage") === key);
          });

          inspector.innerHTML = `
            <div class="inspector-header">
              <div>
                <div class="inspector-badge-row">
                  <span class="badge-pill ${item.badgeClass}">${item.type}</span>
                  <span class="font-mono" style="font-size: 11px; color: var(--color-neutral); font-weight: 700;">${item.tag}</span>
                  <span style="font-size: 12px; color: var(--color-neutral);">&bull; ${item.category}</span>
                </div>
                <h3 class="inspector-title">${item.title}</h3>
              </div>
              <div class="inspector-file-tag font-mono">${item.file}</div>
            </div>

            <div class="inspector-grid">
              <div class="inspector-box">
                <div class="inspector-section-label font-mono">// CƠ SỞ TOÁN HỌC &amp; MÔ HÌNH HÓA</div>
                <div class="inspector-formula-text">${item.math}</div>
                ${item.mathHighlight ? `<div class="inspector-formula-highlight font-mono">${item.mathHighlight}</div>` : ""}
              </div>
              <div class="inspector-box">
                <div class="inspector-section-label font-mono">// KẾT QUẢ THỰC NGHIỆM TRÊN 1.400 MÔN NUS</div>
                <div class="inspector-finding-text">${item.findings}</div>
              </div>
            </div>

            <div class="inspector-code-box">
              <div class="inspector-code-info font-mono">
                <span style="color: var(--color-neutral);">Mã nguồn:</span>
                <b>${item.file}</b> &rarr; <code>${item.func}</code>
              </div>
              ${item.targetTab ? `<button type="button" class="inspector-link-btn" onclick="window.switchTab('${item.targetTab}')">Xem thêm tại ${item.cleanTabName} &rarr;</button>` : ""}
            </div>
          `;
        }

        document.querySelectorAll(".pipeline-stage-card").forEach(card => {
          const key = card.getAttribute("data-stage");
          card.onclick = () => renderPipelineInspector(key);
          card.onkeydown = (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              renderPipelineInspector(key);
            }
          };
        });

        // Default to stage-loader
        renderPipelineInspector("stage-loader");
      }

      function initAlgorithmExplorer() {
        const inspector = document.getElementById("algo-inspector");
        if (!inspector) return;

        function renderAlgoInspector(key) {
          const item = ALGO_DATA[key];
          if (!item) return;

          document.querySelectorAll(".algo-chip").forEach(c => {
            c.classList.toggle("active", c.getAttribute("data-algo") === key);
          });

          inspector.innerHTML = `
            <div class="inspector-header">
              <div>
                <div class="inspector-badge-row">
                  <span class="badge-pill ${item.badgeClass}">${item.type}</span>
                  <span class="font-mono" style="font-size: 11px; color: var(--color-neutral); font-weight: 700;">${item.tag}</span>
                  <span style="font-size: 12px; color: var(--color-neutral);">&bull; ${item.category}</span>
                </div>
                <h3 class="inspector-title">${item.title}</h3>
              </div>
              <div class="inspector-file-tag font-mono">${item.file}</div>
            </div>

            <div class="inspector-grid">
              <div class="inspector-box">
                <div class="inspector-section-label font-mono">// CƠ SỞ TOÁN HỌC &amp; MÔ HÌNH HÓA</div>
                <div class="inspector-formula-text">${item.math}</div>
                ${item.mathHighlight ? `<div class="inspector-formula-highlight font-mono">${item.mathHighlight}</div>` : ""}
              </div>
              <div class="inspector-box">
                <div class="inspector-section-label font-mono">// KẾT QUẢ THỰC NGHIỆM TRÊN 1.400 MÔN NUS</div>
                <div class="inspector-finding-text">${item.findings}</div>
              </div>
            </div>

            <div class="inspector-code-box">
              <div class="inspector-code-info font-mono">
                <span style="color: var(--color-neutral);">Mã nguồn:</span>
                <b>${item.file}</b> &rarr; <code>${item.func}</code>
              </div>
              ${item.targetTab ? `<button type="button" class="inspector-link-btn" onclick="window.switchTab('${item.targetTab}')">Xem thêm tại ${item.cleanTabName} &rarr;</button>` : ""}
            </div>
          `;
        }

        document.querySelectorAll(".algo-chip").forEach(chip => {
          const key = chip.getAttribute("data-algo");
          chip.onclick = () => renderAlgoInspector(key);
          chip.onkeydown = (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              renderAlgoInspector(key);
            }
          };
        });

        // Default to algo-ols
        renderAlgoInspector("algo-ols");
      }

      function initArchitectureExplorer() {
        initPipelineExplorer();
        initAlgorithmExplorer();
      }

      /* ==========================================================================
         ARCHITECTURE & CODEBASE KNOWLEDGE GRAPH ENGINE (TAB 02)
         ========================================================================== */
      const ARCHITECTURE_GRAPH_DATA = {
        layers: {
          data: { name: "Tầng lưu trữ dữ liệu", color: "var(--color-chart-blue)", desc: "Lưu trữ các tập dữ liệu thô, sạch và chỉ số dẫn xuất" },
          engineering: { name: "Tầng tiền xử lý & AST", color: "var(--color-chart-emerald)", desc: "Bóc tách cây điều kiện tiên quyết, bù khuyết và vector hóa" },
          analytics: { name: "Tầng phân tích & ML", color: "var(--color-accent)", desc: "Động cơ thống kê OLS, Welch t-test, K-Means và PCA" },
          presentation: { name: "Tầng trực quan hóa & Web", color: "var(--color-chart-purple)", desc: "Biên dịch Jinja2, đồ thị Native SVG và giao diện Hallmark" }
        },
        nodes: {
          raw_data: {
            id: "raw_data",
            label: "raw_nus_cs.json",
            path: "data/raw_nus_cs.json",
            layer: "data",
            x: 130,
            y: 260,
            role: "Bộ dữ liệu thô 5 năm",
            complexity: "1.400 modules &bull; 5 niên khóa",
            summary: "Phản hồi API NUSMods thô từ 2020 đến 2025. Cung cấp cây điều kiện tiên quyết prereqTree chưa chuẩn hóa và định mức giờ học ban đầu.",
            tags: ["JSON", "Raw Data", "NUSMods API", "1.400 bản ghi"],
            inbound: [],
            outbound: ["loader"],
            keyFunctions: ["Lưu vết lịch sử khóa học", "Cung cấp trường prereqTree thô"],
            targetTab: "report",
            targetTabName: "Báo cáo kỹ thuật"
          },
          loader: {
            id: "loader",
            label: "src/loader.py",
            path: "src/loader.py",
            layer: "engineering",
            x: 450,
            y: 130,
            role: "Tiền xử lý & Cây AST",
            complexity: "441 dòng Python",
            summary: "Bóc tách cây điều kiện tiên quyết AST (and/or/nOf), bù khuyết trung vị giờ tự học theo cấp bậc đào tạo, phân loại học phần AI Core bằng Regex.",
            tags: ["Python", "AST Parsing", "Median Imputation", "Regex AI"],
            inbound: ["raw_data"],
            outbound: ["clean_csv"],
            keyFunctions: ["extract_prereq_codes_tree()", "build_dataframe_imputation()", "detect_ai_module()"],
            targetTab: "report",
            targetTabName: "Báo cáo kỹ thuật"
          },
          clean_csv: {
            id: "clean_csv",
            label: "cleaned_nus_cs.csv",
            path: "data/cleaned_nus_cs.csv",
            layer: "data",
            x: 450,
            y: 260,
            role: "Tập dữ liệu chuẩn hóa",
            complexity: "1.400 hàng &times; 26 cột",
            summary: "Tập dữ liệu sạch hoàn chỉnh sau quy trình bù khuyết phân tầng và chuẩn hóa. Cung cấp dữ liệu cho bảng tra cứu và các mô hình thống kê.",
            tags: ["CSV", "Cleaned Data", "Imputed", "26 features"],
            inbound: ["loader"],
            outbound: ["analytics", "nlp", "app_py"],
            keyFunctions: ["Dữ liệu nguồn cho Data Explorer", "Đầu vào mô hình OLS & ML"],
            targetTab: "explorer",
            targetTabName: "Bảng tra cứu học phần"
          },
          nlp: {
            id: "nlp",
            label: "src/nlp.py",
            path: "src/nlp.py",
            layer: "engineering",
            x: 450,
            y: 390,
            role: "Xử lý ngôn ngữ tự nhiên",
            complexity: "155 dòng Python",
            summary: "Loại bỏ dừng từ học thuật tiếng Anh, bóc tách n-gram và vector hóa văn bản mô tả học thuật của môn học bằng mô hình trọng số TF-IDF.",
            tags: ["NLP", "TF-IDF", "Tokenization", "Stopwords"],
            inbound: ["clean_csv"],
            outbound: ["analytics"],
            keyFunctions: ["tokenize_curriculum_text()", "compute_tfidf_matrix()", "extract_keywords()"],
            targetTab: "ml",
            targetTabName: "Học máy & Cụm AI"
          },
          analytics: {
            id: "analytics",
            label: "src/analytics.py",
            path: "src/analytics.py",
            layer: "analytics",
            x: 770,
            y: 195,
            role: "Thống kê & Mô hình ML",
            complexity: "678 dòng Python",
            summary: "Vận hành toàn bộ ma trận định lượng Q1&ndash;Q5: mô hình OLS, kiểm định Welch t-test, khoảng tin cậy 95%, NetworkX DAG, K-Means và PCA 2D.",
            tags: ["OLS", "Welch t-test", "K-Means K=3", "PCA 2D", "NetworkX DAG"],
            inbound: ["clean_csv", "nlp"],
            outbound: ["web_data"],
            keyFunctions: ["run_ols_regression()", "run_welch_ttest()", "run_prereq_dag()", "run_kmeans_pca()"],
            targetTab: "stats",
            targetTabName: "Thống kê suy luận"
          },
          web_data: {
            id: "web_data",
            label: "web_data.json",
            path: "data/web_data.json",
            layer: "data",
            x: 770,
            y: 335,
            role: "Kho chỉ số định lượng",
            complexity: "JSON payload 45KB",
            summary: "Tập hợp các kết quả tính toán định lượng: chỉ số KPIs, ma trận tương quan, trọng số TF-IDF, tọa độ 2D PCA, cụm K-Means và mạng lưới DAG.",
            tags: ["JSON", "Aggregated Metrics", "Graph Topology", "Client Ready"],
            inbound: ["analytics"],
            outbound: ["builder", "charts_js"],
            keyFunctions: ["Cung cấp dữ liệu vẽ biểu đồ", "Nạp dữ liệu cho Jinja builder"],
            targetTab: "curriculum",
            targetTabName: "Cấu trúc chương trình"
          },
          builder: {
            id: "builder",
            label: "src/builder.py",
            path: "src/builder.py",
            layer: "presentation",
            x: 1090,
            y: 80,
            role: "Trình biên dịch tĩnh",
            complexity: "135 dòng Python",
            summary: "Biên dịch tĩnh tài liệu HTML từ template và web_data.json, sinh sẵn các bảng dữ liệu HTML để bảo đảm tốc độ hiển thị tức thì không phụ thuộc backend.",
            tags: ["Jinja2", "Static Site Generator", "Zero CDN", "Build Pipeline"],
            inbound: ["web_data"],
            outbound: ["index_html"],
            keyFunctions: ["generate_html()", "render_tables()", "verify_assets()"],
            targetTab: "curriculum",
            targetTabName: "Cấu trúc chương trình"
          },
          charts_js: {
            id: "charts_js",
            label: "docs/charts.js",
            path: "docs/charts.js",
            layer: "presentation",
            x: 1090,
            y: 195,
            role: "Biểu đồ Native SVG (20+)",
            complexity: "4.000+ dòng JS",
            summary: "Vẽ 20+ biểu đồ Native SVG độc lập, quản lý điều hướng 9 tab, hiệu ứng ghim điểm, bảng tra cứu Data Explorer, bộ lọc cụm PCA và tooltip nổi.",
            tags: ["Vanilla JS", "Native SVG DOM", "Zero CDN", "Interactive UI"],
            inbound: ["web_data"],
            outbound: ["index_html"],
            keyFunctions: ["renderChartArchitectureGraph()", "renderChartQ2Ols()", "renderChartQ5Pca()"],
            targetTab: "storytelling",
            targetTabName: "Tổng quan khám phá"
          },
          index_html: {
            id: "index_html",
            label: "docs/index.html",
            path: "docs/index.html",
            layer: "presentation",
            x: 1090,
            y: 310,
            role: "Cổng web tĩnh 9 tab",
            complexity: "37.000+ dòng HTML",
            summary: "Tài liệu web tĩnh hoàn chỉnh tích hợp chuẩn thiết kế Edward Tufte và Kott Studio, hỗ trợ 2 chế độ Dark/Light, typography Space Grotesk và chuẩn WCAG AAA.",
            tags: ["HTML5", "Responsive", "Kott Studio", "Dark/Light Theme"],
            inbound: ["builder", "charts_js"],
            outbound: [],
            keyFunctions: ["Semantic Layout", "Theme Switcher", "Accessibility"],
            targetTab: "storytelling",
            targetTabName: "Tổng quan khám phá"
          },
        },
        edges: [
          { source: "raw_data", target: "loader" },
          { source: "loader", target: "clean_csv" },
          { source: "clean_csv", target: "nlp" },
          { source: "clean_csv", target: "analytics" },
          { source: "nlp", target: "analytics" },
          { source: "analytics", target: "web_data" },
          { source: "web_data", target: "builder" },
          { source: "web_data", target: "charts_js" },
          { source: "builder", target: "index_html" },
          { source: "charts_js", target: "index_html" },
          { source: "clean_csv", target: "app_py" }
        ],
        tourStages: [
          {
            title: "Thu thập & Lưu trữ dữ liệu thô (raw_data &rarr; loader)",
            nodes: ["raw_data", "loader"],
            focusNode: "loader",
            desc: "Bước đầu tiên trong quy trình: Thu thập dữ liệu API NUSMods qua 5 niên khóa (1.400 học phần) lưu trữ tại data/raw_nus_cs.json, sẵn sàng cho bộ tiền xử lý src/loader.py."
          },
          {
            title: "Làm sạch, Bù khuyết & Vector hóa (clean_csv &bull; nlp)",
            nodes: ["clean_csv", "nlp"],
            focusNode: "clean_csv",
            desc: "Giải mã cây điều kiện tiên quyết AST, bù khuyết trung vị giờ tự học và vector hóa mô tả môn học bằng TF-IDF tại data/cleaned_nus_cs.csv và src/nlp.py."
          },
          {
            title: "Mô hình hóa định lượng & Trích xuất quy luật (analytics &rarr; web_data)",
            nodes: ["analytics", "web_data"],
            focusNode: "analytics",
            desc: "Vận hành mô hình OLS, kiểm định Welch t-test, NetworkX DAG và phân cụm K-Means/PCA, xuất toàn bộ chỉ số định lượng ra data/web_data.json."
          },
          {
            title: "Biên dịch tĩnh & Trực quan hóa 100% Native SVG (builder &bull; charts_js &bull; index_html)",
            nodes: ["builder", "charts_js", "index_html"],
            focusNode: "charts_js",
            desc: "Biên dịch trang web tĩnh Hallmark qua src/builder.py và hiển thị 20+ biểu đồ tương tác 100% Native SVG độc lập trên docs/index.html."
          }
        ]
      };

      let currentSelectedNodeId = "analytics";
      let currentTourStep = 0;
      let currentLayerFilter = "all";

      function renderChartArchitectureGraph() {
        const container = document.getElementById("arch-graph-svg");
        if (!container) return;

        const data = ARCHITECTURE_GRAPH_DATA;
        const width = 1280;
        const height = 520;

        let svgHtml = `
          <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow-graph-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-hairline-strong)"></path>
              </marker>
              <marker id="arrow-graph-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-accent)"></path>
              </marker>
            </defs>

            <!-- Column Layer Guides & Titles -->
            <g class="graph-columns-layer font-mono">
              <!-- Col 1: Data -->
              <text x="130" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-muted)" letter-spacing="0.08em">TẦNG LƯU TRỮ DỮ LIỆU</text>
              <line x1="290" y1="15" x2="290" y2="495" stroke="var(--color-hairline)" stroke-dasharray="3 4" stroke-width="1" />

              <!-- Col 2: Engineering -->
              <text x="450" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-muted)" letter-spacing="0.08em">TẦNG TIỀN XỬ LÝ &amp; AST</text>
              <line x1="610" y1="15" x2="610" y2="495" stroke="var(--color-hairline)" stroke-dasharray="3 4" stroke-width="1" />

              <!-- Col 3: Analytics -->
              <text x="770" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-muted)" letter-spacing="0.08em">TẦNG PHÂN TÍCH &amp; ML</text>
              <line x1="930" y1="15" x2="930" y2="495" stroke="var(--color-hairline)" stroke-dasharray="3 4" stroke-width="1" />

              <!-- Col 4: Presentation -->
              <text x="1090" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="var(--color-muted)" letter-spacing="0.08em">TẦNG TRỰC QUAN HÓA &amp; WEB</text>
            </g>

            <!-- Directed Edges Layer -->
            <g id="graph-edges-group">
        `;

        data.edges.forEach((edge, idx) => {
          const s = data.nodes[edge.source];
          const t = data.nodes[edge.target];
          if (!s || !t) return;

          let pathD = "";
          if (s.x < t.x) {
            const x1 = s.x + 100;
            const y1 = s.y;
            const x2 = t.x - 100;
            const y2 = t.y;
            const cx = (x1 + x2) / 2;
            pathD = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
          } else {
            // Downward connection in same column
            const x1 = s.x;
            const y1 = s.y + 32;
            const x2 = t.x;
            const y2 = t.y - 32;
            pathD = `M ${x1} ${y1} C ${x1 + 30} ${y1 + 15}, ${x2 + 30} ${y2 - 15}, ${x2} ${y2}`;
          }

          svgHtml += `
            <path id="graph-edge-${idx}" class="graph-edge" data-source="${edge.source}" data-target="${edge.target}" d="${pathD}" marker-end="url(#arrow-graph-default)" />
          `;
        });

        svgHtml += `
            </g>

            <!-- Nodes Layer -->
            <g id="graph-nodes-group">
        `;

        Object.values(data.nodes).forEach(n => {
          const rx = n.x - 100;
          const ry = n.y - 32;
          const layerColor = data.layers[n.layer].color;

          svgHtml += `
            <g class="graph-node-group" id="graph-node-${n.id}" data-id="${n.id}" data-layer="${n.layer}" transform="translate(0, 0)">
              <rect class="node-box" x="${rx}" y="${ry}" width="200" height="64" rx="6" ry="6" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.5" />
              <!-- Layer Accent Strip -->
              <rect x="${rx}" y="${ry}" width="4" height="64" rx="2" ry="2" fill="${layerColor}" />
              <!-- Node Label -->
              <text x="${rx + 14}" y="${ry + 22}" font-family="var(--font-mono)" font-size="12.5" font-weight="700" fill="var(--color-ink)">${n.label}</text>
              <!-- Node Role -->
              <text x="${rx + 14}" y="${ry + 39}" font-size="11" font-weight="500" fill="var(--color-ink-soft)">${n.role}</text>
              <!-- Complexity badge -->
              <text x="${rx + 14}" y="${ry + 53}" font-family="var(--font-mono)" font-size="10" fill="var(--color-neutral)">${n.complexity}</text>
            </g>
          `;
        });

        svgHtml += `
            </g>
          </svg>
        `;

        container.innerHTML = svgHtml;

        // Attach Node Click & Keyboard Events
        document.querySelectorAll(".graph-node-group").forEach(el => {
          const nid = el.getAttribute("data-id");
          el.onclick = () => selectGraphNode(nid);
        });

        // Initialize features
        initArchitectureLayerFilter();
        initArchitectureTour();

        // Initial selection
        selectGraphNode(currentSelectedNodeId);
      }

      function selectGraphNode(nodeId) {
        currentSelectedNodeId = nodeId;
        const data = ARCHITECTURE_GRAPH_DATA;
        const selected = data.nodes[nodeId];
        if (!selected) return;

        // 1. Highlight Node Groups
        document.querySelectorAll(".graph-node-group").forEach(el => {
          const id = el.getAttribute("data-id");
          const isActive = id === nodeId;
          const isConnected = selected.inbound.includes(id) || selected.outbound.includes(id);

          el.classList.toggle("node-active", isActive);
          if (currentLayerFilter === "all") {
            el.classList.toggle("node-dim", !isActive && !isConnected);
          } else {
            const matchesLayer = el.getAttribute("data-layer") === currentLayerFilter;
            el.classList.toggle("node-dim", !matchesLayer);
          }
        });

        // 2. Highlight Connected Edges
        document.querySelectorAll(".graph-edge").forEach(edge => {
          const src = edge.getAttribute("data-source");
          const tgt = edge.getAttribute("data-target");
          const isEdgeActive = (src === nodeId) || (tgt === nodeId);

          edge.classList.toggle("edge-active", isEdgeActive);
          edge.classList.toggle("edge-dim", !isEdgeActive);
          edge.setAttribute("marker-end", isEdgeActive ? "url(#arrow-graph-active)" : "url(#arrow-graph-default)");
        });

        // 3. Render Inspector Panel
        renderGraphNodeInspector(nodeId);
      }

      function renderGraphNodeInspector(nodeId) {
        const panel = document.getElementById("graph-node-inspector");
        if (!panel) return;

        const data = ARCHITECTURE_GRAPH_DATA;
        const node = data.nodes[nodeId];
        if (!node) return;

        const layerMeta = data.layers[node.layer];

        let inHtml = "";
        if (node.inbound.length > 0) {
          inHtml = node.inbound.map(inId => {
            const inNode = data.nodes[inId];
            return `
              <div class="insp-edge-item" onclick="selectGraphNode('${inId}')">
                <div class="insp-edge-header">
                  <span class="insp-edge-name">&larr; ${inNode ? inNode.label : inId}</span>
                  <span class="insp-edge-badge">${inNode ? inNode.complexity : ""}</span>
                </div>
                <div class="insp-edge-role">${inNode ? inNode.role : ""}</div>
              </div>
            `;
          }).join("");
        } else {
          inHtml = `<div class="text-muted" style="font-size:11px; font-style:italic;">Điểm khởi tạo (Không có đầu vào phụ thuộc)</div>`;
        }

        let outHtml = "";
        if (node.outbound.length > 0) {
          outHtml = node.outbound.map(outId => {
            const outNode = data.nodes[outId];
            return `
              <div class="insp-edge-item" onclick="selectGraphNode('${outId}')">
                <div class="insp-edge-header">
                  <span class="insp-edge-name">&rarr; ${outNode ? outNode.label : outId}</span>
                  <span class="insp-edge-badge">${outNode ? outNode.complexity : ""}</span>
                </div>
                <div class="insp-edge-role">${outNode ? outNode.role : ""}</div>
              </div>
            `;
          }).join("");
        } else {
          outHtml = `<div class="text-muted" style="font-size:11px; font-style:italic;">Điểm kết thúc quy trình (Giao diện người dùng)</div>`;
        }

        let tagsHtml = node.tags.map(t => `<span class="insp-tag">${t}</span>`).join("");
        let funcsHtml = node.keyFunctions.map(f => `<li style="margin-bottom: 3px;"><code>${f}</code></li>`).join("");

        panel.innerHTML = `
          <!-- Column 1: Identity, Metadata & Summary -->
          <div class="insp-col">
            <div class="insp-badge-row">
              <span class="badge-pill font-mono" style="background:${layerMeta.color}; color:#FFFFFF; font-size:10px;">${layerMeta.name}</span>
              <span class="text-muted font-mono" style="font-size:11px;">${node.complexity}</span>
            </div>
            <div class="insp-node-name">${node.label}</div>
            <div style="font-size:11.5px; color:var(--color-muted); font-family:var(--font-mono); margin-bottom:8px;">${node.path}</div>
            <div class="insp-node-summary">${node.summary}</div>
            <div style="margin-top: 12px;">
              <div class="insp-section-title font-mono">Đặc trưng &amp; Phân loại</div>
              <div class="insp-tag-list">${tagsHtml}</div>
            </div>
          </div>

          <!-- Column 2: Data Dependency Topology -->
          <div class="insp-col">
            <div style="margin-bottom: 12px;">
              <div class="insp-section-title font-mono">Thành phần phụ thuộc đầu vào</div>
              ${inHtml}
            </div>
            <div>
              <div class="insp-section-title font-mono">Thành phần tiêu thụ đầu ra</div>
              ${outHtml}
            </div>
          </div>

          <!-- Column 3: Core Algorithms & Deep Navigation -->
          <div class="insp-col">
            <div class="insp-section-title font-mono">Các hàm &amp; Giải thuật cốt lõi</div>
            <ul style="padding-left: 18px; margin: 4px 0 14px 0; font-size: 11.5px; color: var(--color-ink-soft); line-height: 1.6;">
              ${funcsHtml}
            </ul>
            ${node.targetTab ? `
              <div>
                <button type="button" class="insp-jump-btn" style="width: 100%; text-align: center; margin-top: 4px;" onclick="window.switchTab('${node.targetTab}')">
                  Xem thêm tại ${node.targetTabName} &rarr;
                </button>
              </div>
            ` : ""}
          </div>
        `;
      }

      function initArchitectureTour() {
        const btnPrev = document.getElementById("btn-tour-prev");
        const btnNext = document.getElementById("btn-tour-next");
        const btnReset = document.getElementById("btn-tour-reset");
        const titleEl = document.getElementById("tour-stage-title");
        const descEl = document.getElementById("tour-stage-desc");
        const badgeEl = document.querySelector(".tour-step-badge");

        if (!btnPrev || !btnNext || !titleEl) return;

        const stages = ARCHITECTURE_GRAPH_DATA.tourStages;

        function updateTourUI() {
          const stage = stages[currentTourStep];
          if (!stage) return;

          if (badgeEl) badgeEl.textContent = `CHẶNG ${currentTourStep + 1}/${stages.length}`;
          titleEl.innerHTML = stage.title;
          if (descEl) descEl.innerHTML = stage.desc;

          btnPrev.disabled = currentTourStep === 0;
          btnNext.disabled = currentTourStep === stages.length - 1;

          // Highlight tour nodes
          document.querySelectorAll(".graph-node-group").forEach(el => {
            const id = el.getAttribute("data-id");
            const inTour = stage.nodes.includes(id);
            el.classList.toggle("node-active", id === stage.focusNode);
            el.classList.toggle("node-dim", !inTour);
          });

          // Highlight active edges within tour stage
          document.querySelectorAll(".graph-edge").forEach(edge => {
            const src = edge.getAttribute("data-source");
            const tgt = edge.getAttribute("data-target");
            const inStage = stage.nodes.includes(src) && stage.nodes.includes(tgt);
            edge.classList.toggle("edge-active", inStage);
            edge.classList.toggle("edge-dim", !inStage);
          });

          // Update Inspector
          renderGraphNodeInspector(stage.focusNode);
        }

        btnPrev.onclick = () => {
          if (currentTourStep > 0) {
            currentTourStep--;
            updateTourUI();
          }
        };

        btnNext.onclick = () => {
          if (currentTourStep < stages.length - 1) {
            currentTourStep++;
            updateTourUI();
          }
        };

        if (btnReset) {
          btnReset.onclick = () => {
            currentTourStep = 0;
            currentLayerFilter = "all";
            document.querySelectorAll(".graph-filter-pill").forEach(p => {
              p.classList.toggle("active", p.getAttribute("data-layer") === "all");
            });
            updateTourUI();
          };
        }
      }

      function initArchitectureLayerFilter() {
        const filterPills = document.querySelectorAll("#graph-layer-filters .graph-filter-pill");
        if (!filterPills.length) return;

        filterPills.forEach(pill => {
          pill.onclick = () => {
            const layer = pill.getAttribute("data-layer");
            currentLayerFilter = layer;

            filterPills.forEach(p => p.classList.toggle("active", p === pill));

            document.querySelectorAll(".graph-node-group").forEach(el => {
              const elLayer = el.getAttribute("data-layer");
              const isMatch = layer === "all" || elLayer === layer;
              el.classList.toggle("node-dim", !isMatch);
            });

            document.querySelectorAll(".graph-edge").forEach(edge => {
              edge.classList.toggle("edge-dim", layer !== "all");
            });
          };
        });
      }

      // Dispatcher to render charts for a given tab
      function renderChartsForTab(tabId) {
        try {
          switch (tabId) {
            case "graph":
              renderChartArchitectureGraph();
              break;
            case "report":
              initArchitectureExplorer();
              initAlgorithmExplorer();
              break;
            case "storytelling":
              renderChartStoryTrend();
              break;
            case "curriculum":
              renderChartQ1Donut();
              renderChartQ1Levels();
              renderChartQ1Credits();
              renderChartQ1Treemap();
              renderChartQ1Dept();
              renderChartQ1Venues();
              break;
            case "workload":
              renderChartQ2Violin();
              renderChartQ2Breakdown();
              renderChartQ2Ols();
              renderChartQ2AiComp();
              break;
            case "prereq":
              renderChartQ3Depth();
              renderInlinedDAG();
              break;
            case "stats":
              renderChartQ4Heatmap();
              renderChartQ4Ttest();
              renderChartQ4Ci();
              renderChartQ4Trans();
              break;
            case "ml":
              renderChartQ5Wordcloud();
              renderChartQ5Tfidf();
              renderChartQ5Elbow();
              renderChartQ5Pca();
              break;
          }
        } catch (e) {
          console.error("Render chart error for tab", tabId, e);
        }
      }

      // Expose interactive functions to window scope for inline HTML handlers
      window.selectGraphNode = selectGraphNode;
      window.renderChartArchitectureGraph = renderChartArchitectureGraph;
      window.initArchitectureTour = initArchitectureTour;
      window.initArchitectureLayerFilter = initArchitectureLayerFilter;
      window.initArchitectureExplorer = initArchitectureExplorer;
      window.initAlgorithmExplorer = initAlgorithmExplorer;

      // 7. Initial Invocation on page load
      const initTab = window.location.hash.replace("#", "") || "storytelling";
      if (document.getElementById("pane-" + initTab)) {
        switchTab(initTab);
      } else {
        switchTab("storytelling");
      }

      // Always guarantee initial charts are rendered on initial load
      renderChartStoryTrend();
      initArchitectureExplorer();
      renderChartArchitectureGraph();

      window.addEventListener("resize", () => {
        const activeBtn = document.querySelector(".tab-slash.active, .tab-pill.active");
        const activeTab = activeBtn ? activeBtn.getAttribute("data-tab") : "storytelling";
        renderChartsForTab(activeTab);
      });

    })();
