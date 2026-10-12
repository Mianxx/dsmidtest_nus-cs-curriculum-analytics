/**
 * animation.js — Cổng hiệu ứng tối giản & Động cơ đếm số thực nghiệm
 * 100% Cuộn trang nguyên bản phần cứng (Native Hardware-Accelerated Scroll)
 * Thư viện Lenis smooth scroll đã được gỡ bỏ hoàn toàn theo yêu cầu người dùng để triệt tiêu độ trễ
 * Triệt tiêu hoàn toàn giật lag, 0ms độ trễ, tương thích hoàn hảo 120Hz/60Hz
 */

(function () {
  'use strict';

  // 1. Accessibility: Tôn trọng cấu hình giảm chuyển động của hệ điều hành
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Tương thích ngược: Cung cấp đối tượng cuộn nguyên bản cho các bộ điều khiển
  window.lenisScroll = {
    scrollTo: function (target) {
      if (typeof target === 'number') {
        window.scrollTo(0, target);
      } else if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView();
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView();
      }
    },
    resize: function () {}
  };

  /* ==========================================================================
     3. Khởi tạo hiển thị văn bản tĩnh không cắt chữ (Zero Truncation)
     ========================================================================== */
  function initMaskedReveals() {
    document.querySelectorAll('.reveal-item, .reveal-card').forEach(el => {
      el.classList.add('is-revealed');
    });
  }

  /* ==========================================================================
     4. Hiệu ứng đếm số lăn mượt mà cho các thẻ chỉ số KPI (requestAnimationFrame)
     ========================================================================== */
  let counterObserver = null;

  function initKpiCounters() {
    counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        obs.unobserve(el);

        const rawText = el.getAttribute('data-raw-val') || el.textContent.trim();
        if (!el.getAttribute('data-raw-val')) {
          el.setAttribute('data-raw-val', rawText);
        }

        // Bỏ qua các công thức như "y = 0.29x + 2.06" hoặc khoảng tin cậy "[11.22, 11.95]"
        if (rawText.includes('=') || rawText.includes('<') || rawText.includes('[')) return;

        const numMatch = rawText.match(/([\d,.]+)/);
        if (!numMatch) return;

        const cleanStr = numMatch[1].replace(/,/g, '');
        const targetVal = parseFloat(cleanStr);
        if (isNaN(targetVal)) return;

        const hasComma = numMatch[1].includes(',');
        const decimals = cleanStr.includes('.') ? cleanStr.split('.')[1].length : 0;
        const prefix = rawText.substring(0, numMatch.index);
        const suffix = rawText.substring(numMatch.index + numMatch[0].length);

        if (prefersReducedMotion) return;

        let startTime = null;
        const duration = 600; // 0.6s phản hồi nhanh

        function updateCount(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = targetVal * easeProgress;

          let formattedNum = decimals > 0 ? currentVal.toFixed(decimals) : Math.round(currentVal).toString();
          if (hasComma) {
            const parts = formattedNum.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formattedNum = parts.join('.');
          }

          el.innerHTML = prefix + formattedNum + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            el.innerHTML = rawText;
          }
        }

        requestAnimationFrame(updateCount);
      });
    }, {
      threshold: 0.1
    });

    const activePane = document.querySelector('.tab-pane.active') || document;
    activePane.querySelectorAll('.kpi-num').forEach(el => counterObserver.observe(el));
  }

  /* ==========================================================================
     5. Lớp phủ hạt phim điện ảnh mờ tinh tế (Grain Texture Overlay)
     ========================================================================== */
  function initGrainOverlay() {
    if (!document.querySelector('.grain-overlay')) {
      const grain = document.createElement('div');
      grain.className = 'grain-overlay';
      grain.setAttribute('aria-hidden', 'true');
      document.body.appendChild(grain);
    }
  }

  /* ==========================================================================
     6. Thanh điều hướng đầu trang & Nút cuộn lên đầu trang nguyên bản
     ========================================================================== */
  function initHeaderAndBackToTop() {
    const header = document.querySelector('.site-header');

    let scrollBtn = document.querySelector('.scroll-top-btn');
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-top-btn';
      scrollBtn.setAttribute('aria-label', 'Cuộn lên đầu trang');
      scrollBtn.innerHTML = '<span>Lên đầu trang</span> &uarr;';
      document.body.appendChild(scrollBtn);
    }

    scrollBtn.addEventListener('click', () => {
      window.scrollTo(0, 0);
    });

    const updateScrollState = () => {
      const scrollY = window.scrollY;

      if (header) {
        if (scrollY > 30) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }

      if (scrollBtn) {
        if (scrollY > 400) {
          scrollBtn.classList.add('visible');
          const footer = document.querySelector('.site-footer');
          if (footer) {
            const footerRect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (footerRect.top < windowHeight) {
              const footerVisibleHeight = windowHeight - footerRect.top;
              scrollBtn.style.bottom = `${Math.min(58, Math.max(24, 24 + footerVisibleHeight * 0.35))}px`;
            } else {
              scrollBtn.style.bottom = '24px';
            }
          }
        } else {
          scrollBtn.classList.remove('visible');
          scrollBtn.style.bottom = '24px';
        }
      }
    };

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
  }

  /* ==========================================================================
     7. Tích hợp chuyển Tab: Khôi phục cuộn tức thì lên đầu trang
     ========================================================================== */
  function triggerTabCounters(tabId) {
    if (prefersReducedMotion) return;
    const activePane = document.getElementById(`pane-${tabId}`);
    if (!activePane || !counterObserver) return;
    activePane.querySelectorAll('.kpi-num').forEach(el => {
      counterObserver.observe(el);
    });
  }

  function patchTabSwitching() {
    const originalSwitchTab = window.switchTab;
    if (typeof originalSwitchTab === 'function') {
      window.switchTab = function (tabId) {
        originalSwitchTab(tabId);
        window.scrollTo(0, 0);
        triggerTabCounters(tabId);
      };
    }
  }

  /* ==========================================================================
     8. Khởi chạy khi DOM sẵn sàng
     ========================================================================== */
  function init() {
    initGrainOverlay();
    initMaskedReveals();
    initKpiCounters();
    initHeaderAndBackToTop();
    patchTabSwitching();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
