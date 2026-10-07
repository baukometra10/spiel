const gallery = document.getElementById("gallery");
const drawingCount = document.getElementById("drawingCount");

function renderGallery() {
  const drawings = getDrawings();
  drawingCount.innerText = drawings.length;
  const starCount = document.getElementById("starCount");
  if (starCount) {
    starCount.innerText = getStars();
  }

  if (!drawings.length) {
    gallery.innerHTML = `
      <div class="gallery-empty">
        <div style="font-size:48px;margin-bottom:8px;">🎨✨</div>
        لا توجد لوحات بعد… لكن مغامرتك الفنية تبدأ الآن!<br>
        ارسمي شيئاً جميلاً واحفظيه ليظهر هنا كتحفة فنية 💖
        <br><br>
        <a class="button-small" href="studio.html">🎨 بدء الرسم الآن</a>
      </div>`;
    return;
  }

  gallery.innerHTML = drawings
    .map(
      (drawing, index) => `
      <div class="gallery-item">
        <div class="gallery-image">
          <img src="${drawing.image}" alt="لوحة فنية رقم ${index + 1}" />
        </div>
        <div class="gallery-meta">
          <span>✨ ${drawing.date}</span>
          <div class="gallery-actions">
            <button class="button-small" onclick="shareDrawing(${index})">مشاركة</button>
            <button class="button-small" onclick="downloadDrawing(${index})">تنزيل</button>
            <button class="button-small danger" onclick="deleteDrawing(${index})">حذف</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function clearGallery() {
  if (!confirm("هل تريدين حذف كل اللوحات؟")) {
    return;
  }
  clearDrawings();
  renderGallery();
  alert("تم حذف كل اللوحات. يمكنك البدء من جديد!");
}

function deleteDrawing(index) {
  if (!confirm("هل تريدين حذف هذه اللوحة؟")) {
    return;
  }
  removeDrawing(index);
  renderGallery();
}

async function downloadDrawing(index) {
  const drawings = getDrawings();
  if (index < 0 || index >= drawings.length) {
    return;
  }
  const drawing = drawings[index];
  try {
    const framed = await createFramedArtwork(drawing.image, getChildName());
    const safeDate = drawing.date
      ? drawing.date.replace(/[\W_]+/g, "-").replace(/^-+|-+$/g, "")
      : `${index + 1}`;
    const link = document.createElement("a");
    link.href = framed;
    link.download = `لوحة-كوكو-${safeDate}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    const link = document.createElement("a");
    link.href = drawing.image;
    link.download = `لوحة-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function shareDrawing(index) {
  const drawings = getDrawings();
  if (index < 0 || index >= drawings.length) {
    return;
  }
  try {
    const result = await shareArtwork(drawings[index].image, getChildName());
    if (result === "shared") {
      alert("تم إرسال اللوحة 💖");
    } else if (result === "downloaded") {
      alert("تم تنزيل اللوحة بإطار جميل للمشاركة 🖼️");
    }
  } catch (error) {
    if (error && error.name === "AbortError") return;
    alert("تعذر المشاركة الآن.");
  }
}

window.addEventListener("DOMContentLoaded", renderGallery);
