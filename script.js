(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const current = document.getElementById('currentSlide');
  const total = document.getElementById('totalSlides');
  const progress = document.getElementById('progressBar');
  const deck = document.getElementById('deck');
  let index = 0;
  let touchStartX = 0;

  total.textContent = String(slides.length);

  const clamp = (value) => Math.max(0, Math.min(slides.length - 1, value));
  const fragmentsFor = (slide) => {
    if (slide.dataset.build !== 'alternating') return [];
    const columns = Array.from(slide.querySelectorAll('.compare ul'));
    const left = Array.from(columns[0]?.querySelectorAll('li') ?? []);
    const right = Array.from(columns[1]?.querySelectorAll('li') ?? []);
    const ordered = [];
    const rows = Math.max(left.length, right.length);
    for (let row = 0; row < rows; row += 1) {
      if (left[row]) ordered.push(left[row]);
      if (right[row]) ordered.push(right[row]);
    }
    return ordered;
  };

  const setRevealedCount = (slide, count) => {
    fragmentsFor(slide).forEach((item, itemIndex) => {
      item.classList.toggle('revealed', itemIndex < count);
    });
  };

  const show = (nextIndex, updateHash = true, entryDirection = 0) => {
    index = clamp(nextIndex);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) {
        const fragments = fragmentsFor(slide);
        setRevealedCount(slide, entryDirection < 0 ? fragments.length : 0);
      }
    });
    current.textContent = String(index + 1);
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    if (updateHash) history.replaceState(null, '', `#${index + 1}`);
    document.title = `${slides[index].getAttribute('aria-label')} · The Rhythms of Renewal`;
  };

  const move = (amount) => {
    const slide = slides[index];
    const fragments = fragmentsFor(slide);
    const revealed = fragments.filter((item) => item.classList.contains('revealed')).length;
    if (amount > 0 && revealed < fragments.length) {
      setRevealedCount(slide, revealed + 1);
      return;
    }
    if (amount < 0 && revealed > 0) {
      setRevealedCount(slide, revealed - 1);
      return;
    }
    show(index + amount, true, amount);
  };
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await deck.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      // Full-screen support varies by browser and device.
    }
  };

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'previous') move(-1);
    if (action === 'next') move(1);
    if (action === 'fullscreen') toggleFullscreen();
  });

  document.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault(); move(1);
    }
    if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault(); move(-1);
    }
    if (event.key === 'Home') { event.preventDefault(); show(0); }
    if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });

  deck.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });
  deck.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 55) move(distance < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const requested = Number.parseInt(location.hash.slice(1), 10);
    if (Number.isFinite(requested)) show(requested - 1, false);
  });

  const requested = Number.parseInt(location.hash.slice(1), 10);
  show(Number.isFinite(requested) ? requested - 1 : 0, false);
})();
