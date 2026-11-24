(function () {
      'use strict';

      let currentAttraction = null;
      let currentGallery = [];
      let currentSlideIndex = 0;

      // Extract requested attraction ID from URL query
      function getRequestedAttractionId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || '';
      }

      function getAttractionNumericPrice(attr) {
        if (!attr) return 0;
        if (window.TourismHubStore && typeof TourismHubStore.parseNumericPriceFromLabel === 'function') {
          return TourismHubStore.parseNumericPriceFromLabel(attr.admission || attr.priceLabel || '', attr.price);
        }
        return (typeof attr.price === 'number' && !isNaN(attr.price)) ? attr.price : 0;
      }

      function populateAttractionDetailsUI(attr) {
        if (!attr) return;
        document.title = `${attr.title} — TourismHub`;
        const titleEl = document.getElementById('detailsTitle');
        const breadcrumbTitle = document.getElementById('breadcrumbCurrentTitle');
        const topHeading = document.getElementById('topPageHeading');
        if (titleEl) titleEl.textContent = attr.title;
        if (breadcrumbTitle) breadcrumbTitle.textContent = attr.title;
        if (topHeading) topHeading.textContent = attr.title;

        const catEl = document.getElementById('detailsCategory');
        const badgeEl = document.getElementById('detailsBadge');
        if (catEl) catEl.textContent = attr.category || 'Tourist Spot';
        if (badgeEl) badgeEl.textContent = attr.badge || 'Featured Destination';

        const ratingEl = document.getElementById('detailsRating');
        const reviewsEl = document.getElementById('detailsReviews');
        if (ratingEl) ratingEl.textContent = attr.rating || '4.8';
        if (reviewsEl) reviewsEl.textContent = `(${attr.reviews || '1.2k'} verified tourist reviews)`;

        const descEl = document.getElementById('detailsDescription');
        if (descEl) descEl.textContent = attr.description || 'Experience world-class resort amenities and sights with real-time pass issuance and gate verification.';

        const locEl = document.getElementById('detailsLocation');
        const hoursEl = document.getElementById('detailsHours');
        const priceEl = document.getElementById('detailsPrice');
        const numericFee = getAttractionNumericPrice(attr);
        const syncedAdmission = attr.admission || attr.priceLabel || (numericFee > 0 ? `₱${numericFee}` : 'Free Admission');

        if (locEl) locEl.textContent = attr.location || 'Metro Manila';
        if (hoursEl) hoursEl.textContent = attr.operatingHours || '08:00 AM – 06:00 PM';
        if (priceEl) priceEl.textContent = syncedAdmission;

        // Google Map Embed & External Link
        const mapIframe = document.getElementById('detailsGoogleMapIframe');
        const mapAddrLabel = document.getElementById('detailsMapAddressLabel');
        const mapExtLink = document.getElementById('detailsOpenGoogleMapsLink');
        const rawMapInput = attr.rawMapEmbed || attr.mapEmbed || attr.map_embed || '';
        const embedUrl = (window.TourismHubStore && typeof TourismHubStore.normalizeMapEmbedUrl === 'function')
          ? TourismHubStore.normalizeMapEmbedUrl(rawMapInput, attr.title, attr.location)
          : `https://maps.google.com/maps?q=${encodeURIComponent(`${attr.title}, ${attr.location || 'Manila'}, Philippines`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

        if (mapIframe && mapIframe.getAttribute('src') !== embedUrl) {
          mapIframe.src = embedUrl;
          mapIframe.title = `Google Map of ${attr.title}`;
        }
        if (mapAddrLabel) {
          mapAddrLabel.textContent = `${attr.title} · ${attr.location || 'Metro Manila'}, Philippines`;
        }
        if (mapExtLink) {
          const extQuery = encodeURIComponent(`${attr.title}, ${attr.location || 'Manila'}, Philippines`);
          mapExtLink.href = `https://www.google.com/maps/search/?api=1&query=${extQuery}`;
        }
      }

      // Initialize destination data and page UI
      function initDetailsPage() {
        if (!window.TourismHubStore) return;

        const catalog = TourismHubStore.getCatalog();
        if (!catalog || catalog.length === 0) return;

        const reqId = getRequestedAttractionId();
        currentAttraction = catalog.find(a => a.id === reqId) || catalog[0];

        // 1-5. Populate Metadata, Synced Admission Rates & Google Map Embed
        populateAttractionDetailsUI(currentAttraction);

        // Search Input Navigation
        const searchInput = document.getElementById('headerSearchInput');
        if (searchInput && !searchInput.dataset.initialized) {
          searchInput.dataset.initialized = 'true';
          searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              const q = encodeURIComponent(this.value.trim());
              if (q) window.location.href = `attractions.html?search=${q}`;
            }
          });
        }

        // 6. Capacity Meter from Real-Time Store
        updateCapacityUI();

        // 7. Initialize Gallery & Carousel
        initCarousel();

        // 8. Update Favorite Button UI
        updateFavoriteButtonUI();

        window.renderAttractionEvents = function renderAttractionEvents(attractionId) {
          const gridEl = document.getElementById('attractionUpcomingEventsGrid');
          if (!gridEl) return;

          const eventsList = (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function')
            ? TourismHubStore.getEvents(attractionId)
            : [];

          if (!eventsList || eventsList.length === 0) {
            gridEl.innerHTML = `
              <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 14px; padding: 2rem 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.92rem;">
                No upcoming events scheduled for this attraction.
              </div>
            `;
            return;
          }

          const esc = (str) => String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

          function splitScheduleAndTime(ev) {
            const raw = String(ev.operatingHours || '').trim();
            if (raw.includes('·')) {
              const parts = raw.split('·').map(s => s.trim());
              return { schedule: ev.eventDate || parts[0] || 'TBA', time: parts[1] || 'TBA' };
            }
            return { schedule: ev.eventDate || 'TBA', time: raw || 'TBA' };
          }

          gridEl.innerHTML = eventsList.map(ev => {
            const img = (Array.isArray(ev.images) && ev.images[0]) || ev.image || 'assets/no-image.svg';
            const { schedule, time } = splitScheduleAndTime(ev);
            return `
              <article class="event-clickable-card" onclick="openEventBookingModal('${esc(ev.id)}')" style="cursor: pointer; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;">
                <div style="position: relative; height: 150px; background: var(--bg-page); overflow: hidden;">
                  <img src="${esc(img)}" alt="${esc(ev.title)}" onerror="this.src='assets/no-image.svg'" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                  <span style="position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: var(--primary, #2563eb); color: #ffffff;">Event</span>
                </div>
                <div style="padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.45rem; flex: 1;">
                  <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main);">${esc(ev.title)}</h3>
                  <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.45;">${esc(ev.description || 'Special scheduled event at this attraction.')}</p>
                  <div style="margin-top: auto; padding-top: 0.65rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; color: var(--text-muted);">
                    <div><strong>Schedule:</strong> ${esc(schedule)}</div>
                    <div><strong>Time:</strong> ${esc(time)}</div>
                    <div><strong>Location:</strong> ${esc(ev.location || 'Manila')}</div>
                    <div><strong>Admission:</strong> ${esc(ev.admission || 'Free')} &bull; <strong>Slots:</strong> ${esc(ev.capacityPerSlot || 50)}</div>
                    <button type="button" style="margin-top: 0.5rem; width: 100%; padding: 0.5rem 0.9rem; font-size: 0.82rem; font-weight: 700; border-radius: 8px; border: none; background: var(--primary, #2563eb); color: #ffffff; cursor: pointer;" onclick="event.stopPropagation(); openEventBookingModal('${esc(ev.id)}')">Book Tickets</button>
                  </div>
                </div>
              </article>
            `;
          }).join('');
        };

        // 9. Render Upcoming Events & Other Locations Grid
        if (currentAttraction && currentAttraction.id) {
          window.renderAttractionEvents(currentAttraction.id);
        }
        renderOtherLocations(catalog);
        const itinTxtEl = document.getElementById('detailsItineraryBtnText');
        const itinBtnEl = document.getElementById('detailsItineraryBtn');
        if (itinTxtEl && window.TourismHubStore && typeof TourismHubStore.isInItinerary === 'function') {
          const inItin = TourismHubStore.isInItinerary(currentAttraction.id);
          itinTxtEl.textContent = inItin ? 'In My Itinerary ✓' : 'Add to Itinerary';
          if (itinBtnEl) itinBtnEl.style.background = inItin ? '#10b981' : 'var(--primary, #0284c7)';
        }

        // 10. Fetch latest pictures & details directly from Supabase Storage bucket & catalog
        syncAttractionFromSupabase();

        // Set default visit date in booking modal to today
        const dateInput = document.getElementById('bookingPassDate');
        if (dateInput && !dateInput.value) {
          const today = new Date().toISOString().split('T')[0];
          dateInput.value = today;
          dateInput.min = today;
        }

        // Auto-fill visitor name if signed in
        const nameInput = document.getElementById('bookingPrimaryGuestName');
        const activeUser = TourismHubStore.getClientAuth() || TourismHubStore.getAdminAuth();
        if (nameInput && activeUser && activeUser.name) {
          nameInput.value = activeUser.name;
        }
      }

      // Compute and update live capacity
      function updateCapacityUI() {
        if (!currentAttraction || !window.TourismHubStore) return;
        const capacityData = TourismHubStore.getCapacityData();
        const slots = capacityData[currentAttraction.id] || [];

        let booked = 0;
        let max = currentAttraction.capacityPerSlot || 100;

        if (slots.length > 0) {
          booked = slots.reduce((acc, s) => acc + (s.booked || 0), 0);
          max = slots.reduce((acc, s) => acc + (s.max || 0), 0) || max;
        }

        const percentage = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;
        const bookedEl = document.getElementById('detailsCapacityBooked');
        const maxEl = document.getElementById('detailsCapacityMax');
        const pctEl = document.getElementById('detailsCapacityPercent');
        const fillEl = document.getElementById('detailsCapacityFill');

        if (bookedEl) bookedEl.textContent = booked.toLocaleString();
        if (maxEl) maxEl.textContent = max.toLocaleString();
        if (pctEl) pctEl.textContent = `${percentage}% Capacity`;
        if (fillEl) {
          fillEl.style.width = `${percentage}%`;
          fillEl.className = 'details-capacity-meter-fill ' + (percentage >= 100 ? 'full' : (percentage >= 80 ? 'moderate' : 'normal'));
        }
      }

      // Fetch fresh attraction data & pictures directly from Supabase (Database & Bucket Folder)
      async function syncAttractionFromSupabase() {
        const reqId = getRequestedAttractionId();
        if (!reqId || !window.TourismHubSupabase || !TourismHubSupabase.isReady()) return;

        try {
          // 1. Fetch live row from Supabase catalog table
          const liveItem = await TourismHubSupabase.fetchCatalogItem(reqId);
          let bucketPhotos = [];

          // 2. Fetch any files stored directly in the attraction's bucket folder: attractions/{attractionId}/*
          try {
            bucketPhotos = await TourismHubSupabase.fetchAttractionImagesFromBucket(reqId);
          } catch (_) {}

          if (liveItem) {
            // Prioritize catalog image first (1 picture limit), falling back to bucket photos
            const liveImages = (Array.isArray(liveItem.images) ? liveItem.images : (liveItem.image ? [liveItem.image] : []))
              .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-') && !url.includes('assets/no-image.svg'));
            const combinedImages = [
              ...liveImages,
              ...bucketPhotos
            ]
              .filter((url, idx, self) => url && typeof url === 'string' && self.indexOf(url) === idx && !url.includes('images.unsplash.com/photo-'))
              .slice(0, 1);

            if (combinedImages.length > 0) {
              liveItem.images = combinedImages;
              liveItem.image = combinedImages[0];
            }

            const prevAttr = currentAttraction;
            if (!liveItem.rawMapEmbed && !liveItem.mapEmbed && prevAttr) {
              liveItem.rawMapEmbed = prevAttr.rawMapEmbed || '';
              liveItem.mapEmbed = prevAttr.mapEmbed || '';
            }
            const syncedAdmission = liveItem.admission || liveItem.priceLabel || (prevAttr && prevAttr.admission) || '';
            if (syncedAdmission) {
              liveItem.admission = syncedAdmission;
              liveItem.priceLabel = syncedAdmission;
              liveItem.price = getAttractionNumericPrice(liveItem);
            }

            currentAttraction = liveItem;
            populateAttractionDetailsUI(currentAttraction);
            initCarousel();
            if (typeof window.renderAttractionEvents === 'function') {
              window.renderAttractionEvents(currentAttraction.id);
            }
            updateCapacityUI();
            updateFavoriteButtonUI();
          }
        } catch (err) {
          console.warn('[Details] Supabase sync error:', err);
        }
      }

      // Build gallery pictures for current destination (strictly genuine uploaded images or fallback)
      function initCarousel() {
        if (!currentAttraction) return;

        let rawImages = [];
        if (Array.isArray(currentAttraction.images) && currentAttraction.images.length > 0) {
          rawImages = currentAttraction.images;
        } else if (currentAttraction.image) {
          rawImages = [currentAttraction.image];
        }

        // Purge any mock Unsplash URLs and enforce 1 picture limit
        rawImages = rawImages
          .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-'))
          .slice(0, 1);

        // If no images left, use default "No Image Available" picture
        if (rawImages.length === 0) {
          rawImages = ['assets/no-image.svg'];
        }

        currentGallery = rawImages.map((url, idx) => ({
          url,
          caption: `${currentAttraction.title}${rawImages.length > 1 ? ` — Photo ${idx + 1}` : ''}`
        }));

        currentSlideIndex = 0;
        renderSlide();
        renderThumbnails();
        updateCarouselControlsVisibility();
      }

      function updateCarouselControlsVisibility() {
        const prevBtn = document.getElementById('carouselPrevBtn');
        const nextBtn = document.getElementById('carouselNextBtn');
        const hasMultiple = currentGallery && currentGallery.length > 1;

        if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
      }

      function renderSlide() {
        if (!currentGallery || currentGallery.length === 0) return;
        const slide = currentGallery[currentSlideIndex];
        const mainImg = document.getElementById('carouselMainImg');
        const captionPill = document.getElementById('carouselCaptionPill');
        const counterEl = document.getElementById('carouselCounter');

        if (mainImg) {
          mainImg.decoding = 'async';
          mainImg.setAttribute('fetchpriority', 'high');
          mainImg.onerror = function () {
            this.onerror = null;
            this.src = 'assets/no-image.svg';
            this.style.opacity = '1';
          };
          mainImg.onload = function () {
            mainImg.style.opacity = '1';
          };
          mainImg.style.opacity = '0.75';
          mainImg.src = slide.url || 'assets/no-image.svg';
          mainImg.alt = slide.caption || 'Attraction image';
          if (mainImg.complete) {
            mainImg.style.opacity = '1';
          }
        }

        if (captionPill) {
          captionPill.textContent = currentGallery.length > 1
            ? `${currentAttraction.title} (${currentSlideIndex + 1} of ${currentGallery.length})`
            : `${currentAttraction.title}`;
        }
        if (counterEl) {
          counterEl.textContent = currentGallery.length > 1
            ? `${currentSlideIndex + 1} / ${currentGallery.length} Photos`
            : '1 Photo';
        }

        // Update active thumbnail border and auto-scroll into view
        const thumbs = document.querySelectorAll('.carousel-thumb-btn');
        thumbs.forEach((th, idx) => {
          const isActive = idx === currentSlideIndex;
          th.classList.toggle('active', isActive);
          if (isActive) {
            th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        });
      }

      function renderThumbnails() {
        const strip = document.getElementById('carouselThumbnails');
        if (!strip) return;

        if (currentGallery.length <= 1) {
          strip.style.display = 'none';
          return;
        }
        strip.style.display = 'flex';

        strip.innerHTML = currentGallery.map((slide, idx) => `
          <button type="button" class="carousel-thumb-btn ${idx === currentSlideIndex ? 'active' : ''}" 
                  data-index="${idx}"
                  onclick="jumpToSlide(${idx})" aria-label="Go to slide ${idx + 1}: ${slide.caption}">
            <img src="${slide.url}" alt="${slide.caption}" loading="lazy" onerror="this.src='assets/no-image.svg'">
          </button>
        `).join('');
      }

      window.jumpToSlide = function (index) {
        if (index >= 0 && index < currentGallery.length) {
          currentSlideIndex = index;
          renderSlide();
        }
      };

      // Prev / Next button handlers
      document.getElementById('carouselPrevBtn')?.addEventListener('click', () => {
        if (currentGallery.length <= 1) return;
        currentSlideIndex = (currentSlideIndex - 1 + currentGallery.length) % currentGallery.length;
        renderSlide();
      });

      document.getElementById('carouselNextBtn')?.addEventListener('click', () => {
        if (currentGallery.length <= 1) return;
        currentSlideIndex = (currentSlideIndex + 1) % currentGallery.length;
        renderSlide();
      });

      // Keyboard navigation support
      document.addEventListener('keydown', (e) => {
        if (currentGallery.length <= 1) return;
        if (e.key === 'ArrowLeft') {
          currentSlideIndex = (currentSlideIndex - 1 + currentGallery.length) % currentGallery.length;
          renderSlide();
        } else if (e.key === 'ArrowRight') {
          currentSlideIndex = (currentSlideIndex + 1) % currentGallery.length;
          renderSlide();
        }
      });

      // Mobile Touch Swipe Navigation
      (function setupTouchSwipe() {
        const viewport = document.getElementById('carouselViewport');
        if (!viewport) return;

        let startX = 0;
        let endX = 0;

        viewport.addEventListener('touchstart', (e) => {
          startX = e.touches[0].clientX;
        }, { passive: true });

        viewport.addEventListener('touchend', (e) => {
          if (currentGallery.length <= 1) return;
          endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              // Swiped left -> Next
              currentSlideIndex = (currentSlideIndex + 1) % currentGallery.length;
            } else {
              // Swiped right -> Prev
              currentSlideIndex = (currentSlideIndex - 1 + currentGallery.length) % currentGallery.length;
            }
            renderSlide();
          }
        }, { passive: true });
      })();

      // Update Favorites Button state
      function updateFavoriteButtonUI() {
        if (!currentAttraction || !window.TourismHubStore) return;
        const isFav = TourismHubStore.isFavorite(currentAttraction.id);
        const btn = document.getElementById('detailsFavoriteBtn');

        if (btn) {
          btn.classList.toggle('active', isFav);
          btn.classList.toggle('saved', isFav);
          btn.setAttribute('title', isFav ? 'Remove from Favorites' : 'Save to Favorites');
          btn.setAttribute('aria-label', isFav ? 'Remove from Favorites' : 'Save to Favorites');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', isFav ? '#ef4444' : 'none');
        }
      }

      window.toggleDetailsFavorite = function () {
        if (!currentAttraction || !window.TourismHubStore) return;
        const res = TourismHubStore.toggleFavorite(currentAttraction.id);
        updateFavoriteButtonUI();

        if (window.showPortalToast) {
          showPortalToast(res.isFavorite
            ? `Saved "${currentAttraction.title}" to your favorites!`
            : `Removed "${currentAttraction.title}" from favorites.`
          );
        }
      };

      // Render Bottom Section: Other Locations Available (Strictly 4 destinations)
      function renderOtherLocations(catalog) {
        const grid = document.getElementById('otherLocationsGrid');
        if (!grid || !catalog) return;

        // Exclude current attraction and display up to 6 locations
        const others = catalog.filter(a => a.id !== currentAttraction.id).slice(0, 6);
        if (others.length === 0) {
          grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">No additional locations available at this moment.</p>';
          return;
        }

        const capacityData = TourismHubStore.getCapacityData();

        grid.innerHTML = others.map(item => {
          const isFav = TourismHubStore.isFavorite(item.id);
          const slots = capacityData[item.id] || [];
          let capText = `${item.capacityPerSlot || 100} slots`;
          if (slots.length > 0) {
            const firstSlot = slots[0];
            capText = `${firstSlot.booked} / ${firstSlot.max} Pax`;
          }

          const numericPrice = getAttractionNumericPrice(item);
          const priceStr = item.admission || item.priceLabel || (numericPrice > 0 ? `₱${numericPrice}` : 'Free Admission');
          const safeImg = (item.image && !String(item.image).includes('images.unsplash.com/photo-'))
            ? item.image
            : 'assets/no-image.svg';

          return `
            <article class="other-loc-card" data-id="${item.id}" style="cursor: pointer; flex: 0 0 260px; scroll-snap-align: start;" onclick="if (!event.target.closest('button')) window.location.href='attraction-details.html?id=${item.id}'">
              <div class="other-loc-media">
                <img src="${safeImg}" alt="${item.title}" class="other-loc-img" loading="lazy" onerror="this.src='assets/no-image.svg'">
                <span class="other-loc-badge">${item.badge || item.category || 'Featured'}</span>
                <button type="button" class="other-loc-fav-btn ${isFav ? 'saved' : ''}" 
                        title="${isFav ? 'Remove from favorites' : 'Save to favorites'}"
                        onclick="event.stopPropagation(); togglePortalFavorite('${item.id}', '${item.title.replace(/'/g, "\\'")}', this, event)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>

              <div class="other-loc-body">
                <h3 class="other-loc-title">${item.title}</h3>
                <div class="other-loc-meta">
                  <div class="other-loc-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                    </svg>
                    <span>${item.location || 'Metro Manila'}</span>
                  </div>
                  <div class="other-loc-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${item.operatingHours || '08:00 AM - 06:00 PM'}</span>
                  </div>
                </div>
              </div>
            </article>
          `;
        }).join('');
      }

      // Booking Modal Logic
      let activeBookingTarget = null;

      function populateBookingFeeTiers(targetItem) {
        const groupEl = document.getElementById('bookingFeeTierGroup');
        const selectEl = document.getElementById('bookingFeeTierSelect');
        if (!groupEl || !selectEl) return;
        const tiers = (targetItem && Array.isArray(targetItem.feeTiers) && targetItem.feeTiers.length > 0)
          ? targetItem.feeTiers
          : [{ label: targetItem?.admission || targetItem?.priceLabel || 'Standard Admission', price: getAttractionNumericPrice(targetItem) }];
        selectEl.innerHTML = tiers.map(t =>
          `<option value="${Number(t.price) || 0}">${t.label} — ${Number(t.price) > 0 ? `₱${t.price}` : 'Free'}</option>`
        ).join('');
        groupEl.style.display = 'block';
      }

      window.toggleDetailsItinerary = function () {
        if (!currentAttraction || !window.TourismHubStore || typeof TourismHubStore.toggleItinerary !== 'function') return;
        const res = TourismHubStore.toggleItinerary(currentAttraction.id);
        const txtEl = document.getElementById('detailsItineraryBtnText');
        const btnEl = document.getElementById('detailsItineraryBtn');
        if (txtEl) {
          txtEl.textContent = res.inItinerary ? 'In My Itinerary ✓' : 'Add to Itinerary';
        }
        if (btnEl) {
          btnEl.style.background = res.inItinerary ? '#10b981' : 'var(--primary, #0284c7)';
        }
        if (typeof window.showItineraryBriefModal === 'function') {
          window.showItineraryBriefModal(currentAttraction.title, res.inItinerary);
        } else if (typeof window.showPortalToast === 'function') {
          window.showPortalToast(res.inItinerary ? `Added "${currentAttraction.title}" to your itinerary!` : `Removed "${currentAttraction.title}" from your itinerary.`);
        }
      };

      window.openDetailsBookingModal = function (targetOverride = null) {
        const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
        const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;

        // Unauthenticated visitor check
        if (!clientAuth && !adminAuth) {
          const returnUrl = encodeURIComponent(`attraction-details.html?id=${currentAttraction ? currentAttraction.id : ''}`);
          window.location.href = `login.html?redirect=${returnUrl}`;
          return;
        }

        activeBookingTarget = targetOverride || currentAttraction;
        const modal = document.getElementById('detailsBookingModal');
        const headingEl = document.getElementById('bookingModalHeading');
        const imgEl = document.getElementById('bookingItemImg');
        const priceEl = document.getElementById('bookingItemPrice');
        const eventDetailsBox = document.getElementById('bookingEventDetailsBox');
        const eventMetaRows = document.getElementById('bookingEventMetaRows');
        const eventDescEl = document.getElementById('bookingEventDescription');

        if (headingEl) {
          headingEl.textContent = targetOverride
            ? `Book Tickets: ${targetOverride.title || 'Event'}`
            : 'Reserve Priority Entry Pass';
        }

        if (eventDetailsBox && eventMetaRows && eventDescEl) {
          if (targetOverride) {
            const rawHours = String(targetOverride.operatingHours || '').trim();
            const parts = rawHours.includes('·') ? rawHours.split('·').map(s => s.trim()) : [targetOverride.eventDate || 'TBA', rawHours || 'TBA'];
            const rawDate = targetOverride.eventDate || parts[0] || '';
            let formattedSched = rawDate || 'TBA';
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
              const dObj = new Date(rawDate + 'T00:00:00');
              if (!isNaN(dObj.getTime())) {
                formattedSched = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }
            }
            const tm = parts[1] || 'TBA';
            eventMetaRows.innerHTML = `
              <div><strong>Schedule:</strong> ${formattedSched}</div>
              <div><strong>Time:</strong> ${tm}</div>
              <div><strong>Location:</strong> ${targetOverride.location || 'Manila'}</div>
            `;
            const maxSlots = Number(targetOverride.capacityPerSlot) || 50;
            const bookedSlots = Math.min(maxSlots, Number(targetOverride.bookedCount || 0));
            const pct = maxSlots > 0 ? Math.round((bookedSlots / maxSlots) * 100) : 0;
            const slotsLabel = document.getElementById('bookingEventSlotsLabel');
            const slotsFill = document.getElementById('bookingEventSlotsFill');
            if (slotsLabel) slotsLabel.textContent = `${maxSlots - bookedSlots} / ${maxSlots} left`;
            if (slotsFill) slotsFill.style.width = `${pct}%`;

            eventDescEl.textContent = targetOverride.description || 'Special scheduled event at this attraction.';
            eventDetailsBox.style.display = 'block';
          } else {
            eventDetailsBox.style.display = 'none';
          }
        }

        const dateInput = document.getElementById('bookingPassDate');
        if (dateInput) {
          if (targetOverride && targetOverride.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(targetOverride.eventDate)) {
            dateInput.value = targetOverride.eventDate;
            dateInput.min = targetOverride.eventDate;
            dateInput.max = targetOverride.eventDate;
            dateInput.readOnly = true;
          } else {
            dateInput.readOnly = false;
            dateInput.removeAttribute('min');
            dateInput.removeAttribute('max');
          }
        }

        const guestNameInput = document.getElementById('bookingPrimaryGuestName');
        const activeUser = clientAuth || adminAuth;
        if (guestNameInput && activeUser && activeUser.name) {
          guestNameInput.value = activeUser.name;
        }

        populateBookingFeeTiers(activeBookingTarget);
        const unitPrice = getActiveBookingUnitPrice();
        const admissionText = activeBookingTarget.admission || activeBookingTarget.priceLabel || '';

        if (imgEl) imgEl.src = (Array.isArray(activeBookingTarget.images) && activeBookingTarget.images[0]) || activeBookingTarget.image || 'assets/hero-banner.jpg';
        if (priceEl) priceEl.textContent = admissionText || (unitPrice > 0 ? `₱${unitPrice}` : 'Free (₱0)');

        recalculateBookingTotal();
        if (modal) {
          modal.classList.add('active');
          modal.style.display = 'flex';
        }
      };

      window.openEventBookingModal = function (eventId) {
        if (!window.TourismHubStore || typeof TourismHubStore.getEvents !== 'function') return;
        const events = TourismHubStore.getEvents(currentAttraction ? currentAttraction.id : undefined);
        const ev = events.find(item => item.id === eventId);
        if (ev) {
          window.openDetailsBookingModal(ev);
        }
      };

      window.closeDetailsBookingModal = function () {
        const modal = document.getElementById('detailsBookingModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      };

      function getActiveBookingUnitPrice() {
        const groupEl = document.getElementById('bookingFeeTierGroup');
        const selectEl = document.getElementById('bookingFeeTierSelect');
        if (groupEl && groupEl.style.display !== 'none' && selectEl && selectEl.value !== '') {
          return Math.max(0, parseFloat(selectEl.value) || 0);
        }
        return getAttractionNumericPrice(activeBookingTarget || currentAttraction);
      }

      // Recalculate price in PHP (₱)
      const visitorCountInput = document.getElementById('bookingVisitorCount');
      const feeTierSelectEl = document.getElementById('bookingFeeTierSelect');
      function recalculateBookingTotal() {
        const target = activeBookingTarget || currentAttraction;
        if (!target || !visitorCountInput) return;
        const count = Math.max(1, parseInt(visitorCountInput.value, 10) || 1);
        const unitPrice = getActiveBookingUnitPrice();
        const total = unitPrice * count;
        const priceEl = document.getElementById('bookingItemPrice');
        if (priceEl && feeTierSelectEl && document.getElementById('bookingFeeTierGroup')?.style.display !== 'none') {
          priceEl.textContent = unitPrice > 0 ? `₱${unitPrice}` : 'Free (₱0)';
        }
        const totalEl = document.getElementById('bookingCalculatedTotal');
        if (totalEl) totalEl.textContent = total > 0 ? `₱${total}` : '₱0 (Free)';
      }

      if (visitorCountInput) {
        visitorCountInput.addEventListener('input', recalculateBookingTotal);
      }
      if (feeTierSelectEl) {
        feeTierSelectEl.addEventListener('change', recalculateBookingTotal);
      }

      // Handle Pass Reservation Submission
      const bookingForm = document.getElementById('detailsPassBookingForm');
      if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!currentAttraction || !window.TourismHubStore) return;

          const activeUser = TourismHubStore.getClientAuth() || TourismHubStore.getAdminAuth();
          const count = parseInt(document.getElementById('bookingVisitorCount')?.value, 10) || 1;
          const guestName = document.getElementById('bookingPrimaryGuestName')?.value || activeUser?.name || 'Tourist Guest';
          const visitDate = document.getElementById('bookingPassDate')?.value || new Date().toISOString().split('T')[0];
          const unitPrice = getAttractionNumericPrice(currentAttraction);
          const totalAmount = unitPrice * count;

          // Generate verified pass reference code
          const randDigits = Math.floor(1000 + Math.random() * 9000);
          const codeSuffix = (currentAttraction.type || 'VIS').substring(0, 3).toUpperCase();
          const passCode = `PASS-${randDigits}-${codeSuffix}`;

          const newPass = {
            code: passCode,
            visitorName: guestName,
            visitorEmail: activeUser?.email || `${guestName.toLowerCase().replace(/\s+/g, '.')}@traveler.ph`,
            bookedByEmail: activeUser?.email || '',
            userId: activeUser?.id || null,
            bookedByUserId: activeUser?.id || null,
            partySize: count,
            attractionId: currentAttraction.id,
            attraction: currentAttraction.title,
            slot: '09:00 AM - 12:00 PM',
            passType: 'Standard Tourist Pass',
            status: 'valid',
            amount: `₱${totalAmount}.00`,
            validDate: visitDate
          };

          TourismHubStore.addPass(newPass);
          closeDetailsBookingModal();
          updateCapacityUI();

          if (window.showPortalToast) {
            showPortalToast(`Pass ${passCode} confirmed! Saved under your account.`);
          }
        });
      }

      // Notifications Modal Trigger (Bell icon)
      window.openNotificationsModal = function () {
        const modal = document.getElementById('notificationsModal');
        const notifBody = document.getElementById('notificationsModalBody');
        if (!modal || !window.TourismHubStore) return;

        const announcements = TourismHubStore.getAnnouncements();
        if (notifBody) {
          if (announcements.length === 0) {
            notifBody.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No active broadcasts at this time.</p>';
          } else {
            const recent = announcements.slice(0, 4);
            notifBody.innerHTML = `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${recent.map(a => `
                  <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: ${a.priority === 'urgent' ? '#fef2f2' : 'var(--bg-page)'}; border: 1px solid ${a.priority === 'urgent' ? '#fecaca' : 'var(--border)'}; border-radius: var(--radius-sm);">
                    <div style="width: 36px; height: 36px; border-radius: 99px; background: ${a.priority === 'urgent' ? '#ef4444' : '#0284c7'}; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                      </svg>
                    </div>
                    <div style="flex: 1;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <span style="font-weight: 700; font-size: 0.92rem; color: ${a.priority === 'urgent' ? '#b91c1c' : 'var(--text-main)'};">${a.title}</span>
                        <span style="font-size: 0.72rem; color: var(--text-light);">${a.timestamp || 'Recent'}</span>
                      </div>
                      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">${a.text}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top: 1.15rem; padding-top: 0.9rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                <a href="notifications.html" class="btn-primary-blue" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; font-weight: 700; font-size: 0.88rem; border-radius: var(--radius-sm);">
                  <span>See More Notifications</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
              </div>
            `;
          }
        }
        modal.classList.add('active');
        modal.style.display = 'flex';
      };

      window.closeNotificationsModal = function () {
        const modal = document.getElementById('notificationsModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
        }
      };

      // Close modals when clicking overlay background
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
          }
        });
      });

      // Multi-tab real-time sync listener (Live catalog, events & bucket image updates)
      if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
        TourismHubStore.onSync(() => {
          const catalog = TourismHubStore.getCatalog();
          const reqId = getRequestedAttractionId();
          const updated = catalog.find(a => a.id === reqId);
          if (updated) {
            currentAttraction = updated;
            populateAttractionDetailsUI(currentAttraction);
            initCarousel();
          }
          if (typeof window.renderAttractionEvents === 'function') {
            window.renderAttractionEvents((currentAttraction && currentAttraction.id) || reqId);
          }
          updateCapacityUI();
          updateFavoriteButtonUI();
        });
      }

      // Initialize on DOM Ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDetailsPage);
      } else {
        initDetailsPage();
      }
    })();
