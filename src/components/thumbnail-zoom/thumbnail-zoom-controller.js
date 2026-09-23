import { Controller } from "@hotwired/stimulus"

import config from "../../data/siteConfig"
import { trigger, isTouchDevice } from "../../js/utils"

const HOVER_DELAY = 300 // ms of hover-intent before the preview opens
const EDGE_MARGIN = 16 // px — minimum gap kept between the preview and the viewport edge

export default class extends Controller {
  static get targets() {
    return ["card", "image", "location", "description"]
  }

  connect() {
    this.disabled = isTouchDevice()
    if (this.disabled) return

    this.activeThumbnail = null
    this.hoverTimer = null
    this.revealFrame = null
    this.largePreloader = null
  }

  isEligible(thumbnail) {
    return Boolean(thumbnail?.photosThumbnail?.isReady)
  }

  onThumbnailEnter(e) {
    if (this.disabled) return

    const thumbnail = e.currentTarget
    if (!this.isEligible(thumbnail) || thumbnail === this.activeThumbnail) return

    this.activeThumbnail = thumbnail
    this.hoverTimer = window.setTimeout(() => this.open(thumbnail), HOVER_DELAY)
  }

  // the list-owner-only context menu (context-menu.liquid, role: "thumbnail") sits on
  // top of the thumbnail — entering it should cancel/close the preview outright so it
  // never covers the menu while the owner is using it, not just get bridged like the
  // card itself does. Moving within the same thumbnail is common (the icon sits in a
  // corner of it), so leaving the icon resumes the normal hover-to-open behavior —
  // but only if the pointer is still over the thumbnail, not actually leaving it
  onContextMenuEnter() {
    if (this.disabled) return

    window.clearTimeout(this.hoverTimer)
    this.hoverTimer = null
    if (this.activeThumbnail) this.close()
  }

  onContextMenuLeave(e) {
    if (this.disabled) return

    const thumbnail = e.currentTarget.closest(".photos-thumbnail")
    if (!thumbnail || !thumbnail.contains(e.relatedTarget) || !this.isEligible(thumbnail)) return

    this.activeThumbnail = thumbnail
    this.hoverTimer = window.setTimeout(() => this.open(thumbnail), HOVER_DELAY)
  }

  onThumbnailLeave(e) {
    if (this.disabled || e.currentTarget !== this.activeThumbnail) return
    // the card is a sibling, not a descendant, of the thumbnail (so it can escape
    // ancestors that clip overflow, e.g. home__thumbnails-wrapper) — it visually
    // occludes the thumbnail once open, which fires this leave the instant it does.
    // Moving onto the card itself isn't really leaving, so let onCardLeave decide instead
    if (this.cardTarget.contains(e.relatedTarget)) return
    this.close()
  }

  // mirrors onThumbnailLeave's relatedTarget check — moving back onto the (occluded)
  // thumbnail isn't a real leave either, though pointer-events make that unreachable
  // in practice; this is what actually closes the preview once the card has occluded it
  onCardLeave(e) {
    if (this.disabled || !this.activeThumbnail) return
    if (this.activeThumbnail.contains(e.relatedTarget)) return
    this.close()
  }

  // same controls as the carousel (carousel-controller.js) — close/addToList/shareImage/
  // downloadImage share its method names so photo-controls.liquid can be dropped into either

  onCloseClicked(e) {
    if (e) e.stopPropagation()
    this.close()
  }

  addToList(e) {
    this.runAction(e, "dialogLists:show")
  }

  shareImage(e) {
    this.runAction(e, "dialogShare:show")
  }

  downloadImage(e) {
    this.runAction(e, "dialogDownload:show")
  }

  // select the photo (same step thumbnail#clicked does, without also triggering
  // thumbnail:click, which would open the carousel), show the dialog, then close
  runAction(e, dialogEvent) {
    if (e) e.stopPropagation()
    if (!this.activeThumbnail) return

    this.activeThumbnail.photosThumbnail.selectPhoto()
    trigger(dialogEvent)
    this.close()
  }

  // the "enlarge" button opens the carousel exactly like clicking the image does —
  // both wire to this one method rather than the image click bubbling up on its own
  openCarousel(e) {
    if (e) e.stopPropagation()
    if (!this.activeThumbnail) return

    this.activeThumbnail.photosThumbnail.clicked(e)
  }

  open(thumbnail) {
    this.cancelReveal()

    // reuse the grid thumbnail's own already-loaded image/info — no extra network
    // fetch, no re-deriving it from the photo data, via its own Stimulus controller
    const tc = thumbnail.photosThumbnail
    const img = tc.imageTarget
    const src = img.currentSrc || img.src
    if (!src) return

    this.imageTarget.src = src
    this.imageTarget.alt = img.alt
    this.locationTarget.textContent = tc.locationTarget.textContent
    this.descriptionTarget.textContent = tc.descriptionTarget.textContent

    // size the card to the photo's real aspect ratio instead of a fixed one —
    // naturalWidth/Height are already known since the thumbnail image is loaded
    if (img.naturalWidth && img.naturalHeight) {
      this.cardTarget.style.setProperty("--zoom-ratio", img.naturalWidth / img.naturalHeight)
    } else {
      this.cardTarget.style.removeProperty("--zoom-ratio")
    }

    this.positionOverImage(thumbnail)

    this.reveal(thumbnail)
    this.loadLargeImage(thumbnail)
  }

  // upgrade from the grid's small (240/480px) source, currently just shown upscaled,
  // to a sharp one — loaded in the background so opening never waits on it
  loadLargeImage(thumbnail) {
    this.cancelLargeImage()

    // sized to the card itself, not the viewport (unlike carousel-controller.js's
    // same 1600/2560 pick, which is right for a fullscreen photo but not this card —
    // it tops out a few hundred px wide, so viewport width alone would over-fetch)
    const targetPx = this.cardTarget.offsetWidth * (window.devicePixelRatio || 1)
    const width = targetPx > 1600 ? 2560 : 1600
    const largeSrc = `${config().PHOTO_SOURCE}${width}/fortepan_${thumbnail.photoId}.jpg`

    const preloader = new Image()
    this.largePreloader = preloader
    preloader.onload = () => {
      if (this.activeThumbnail !== thumbnail) return
      this.largePreloader = null

      // already fully downloaded (this is what just loaded) — decode() first anyway,
      // same as reveal(), so the visible <img> never shows a half-swapped frame
      this.imageTarget.src = largeSrc
      if (this.imageTarget.decode) this.imageTarget.decode().catch(() => {})
    }
    preloader.src = largeSrc
  }

  // abort the in-flight large-image request (if any) rather than let it finish
  // downloading into a card that's since moved on or closed
  cancelLargeImage() {
    if (!this.largePreloader) return
    this.largePreloader.onload = null
    this.largePreloader.src = ""
    this.largePreloader = null
  }

  reveal(thumbnail) {
    // the shared <img> keeps showing whatever it last had decoded until the new src
    // finishes decoding at the card's (much larger) display size — even from cache,
    // that's real raster work. decode() resolves once it's actually safe to paint,
    // so we never reveal the stale previous photo while the new one catches up.
    const decode = this.imageTarget.decode ? this.imageTarget.decode() : Promise.resolve()

    decode
      .catch(() => {}) // broken image — still reveal rather than get stuck open() never finishing
      .then(() => {
        if (this.activeThumbnail !== thumbnail) return

        // double rAF: commit the closed state at the new position to a real frame
        // before adding the class, or the transition can skip straight to the end
        this.revealFrame = requestAnimationFrame(() => {
          this.revealFrame = requestAnimationFrame(() => {
            if (this.activeThumbnail !== thumbnail) return
            this.cardTarget.classList.add("is-zoomed")
          })
        })
      })
  }

  cancelReveal() {
    if (this.revealFrame) cancelAnimationFrame(this.revealFrame)
    this.revealFrame = null
  }

  positionOverImage(thumbnail) {
    // the card is centered on the thumbnail's image, not the whole thumbnail
    // (which also carries the location/description meta below the image). It stays
    // parked on this.element (see connect()/close()) rather than moving into the
    // thumbnail, so its --zoom-left/--zoom-top offsets are relative to that element's
    // own box, not the thumbnail's — this keeps the card from being clipped by an
    // overflow:hidden ancestor closer to the thumbnail (e.g. home__thumbnails-wrapper).
    // this.element is itself the scrolling element (.scrollview), so its
    // getBoundingClientRect() stays put as it's scrolled — top/left of an absolutely
    // positioned child are relative to its unscrolled content origin, so the current
    // scrollTop/scrollLeft has to be added back in to land on the right spot
    const anchorRect = this.element.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()
    const imageRect = thumbnail.photosThumbnail.containerTarget.getBoundingClientRect()

    const centerX = imageRect.left + imageRect.width / 2
    const centerY = imageRect.top + imageRect.height / 2

    this.cardTarget.style.setProperty("--zoom-left", `${centerX - anchorRect.left + this.element.scrollLeft}px`)
    this.cardTarget.style.setProperty("--zoom-top", `${centerY - anchorRect.top + this.element.scrollTop}px`)
    // ~2x the thumbnail's own longer side, before the aspect ratio shapes width vs. height
    this.cardTarget.style.setProperty("--zoom-size", `${Math.max(imageRect.width, imageRect.height) * 2}px`)
    this.clampToBounds(imageRect.top, thumbnailRect.bottom, centerX, centerY)
  }

  clampToBounds(thumbnailTop, thumbnailBottom, centerX, centerY) {
    // the card sits above everything (see .is-zoomed z-index), so horizontally it just
    // needs to stay clear of the viewport edges
    const shiftX = this.clampAxis(
      centerX,
      this.cardTarget.offsetWidth / 2,
      EDGE_MARGIN,
      window.innerWidth - EDGE_MARGIN
    )

    // vertically, use whichever bound is more permissive: the viewport edge, or the
    // thumbnail's own edge (image top, whole wrapper — including the caption — bottom).
    // Near the top/bottom of the scrollview the thumbnail itself may already be partly
    // cut off — in that case follow the thumbnail instead of pulling the card back
    // inside the viewport, so it stays in line with it even if that means the card gets
    // clipped too, rather than visually drifting away from it
    const top = Math.min(EDGE_MARGIN, thumbnailTop)
    const bottom = Math.max(window.innerHeight - EDGE_MARGIN, thumbnailBottom)
    const shiftY = this.clampAxis(centerY, this.cardTarget.offsetHeight / 2, top, bottom)

    this.cardTarget.style.setProperty("--zoom-shift-x", `${shiftX}px`)
    this.cardTarget.style.setProperty("--zoom-shift-y", `${shiftY}px`)
  }

  clampAxis(center, halfSize, min, max) {
    if (center - halfSize < min) return min - (center - halfSize)
    if (center + halfSize > max) return max - (center + halfSize)
    return 0
  }

  close() {
    window.clearTimeout(this.hoverTimer)
    this.hoverTimer = null
    this.cancelReveal()
    this.cancelLargeImage()

    this.cardTarget.classList.remove("is-zoomed")
    this.activeThumbnail = null
  }
}
