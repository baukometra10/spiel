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
    gallery.innerHTML = "<div class=\"gallery-empty\">لا توجد لوحات محفوظة بعد. اذهبي إلى غرفة الرسم لإنشاء لوحة جديدة!<br><br><a class=\"button-small\" href=\"studio.html\">🎨 بدء الرسم الآن</a></div>";
    return;
  }

  gallery.innerHTML = drawings
    .map(
      (drawing, index) => `
      <div class="gallery-item">
        <div class="gallery-image">
          <img src="${drawing.image}" alt="لوحة" />
        </div>
        <div class="gallery-meta">
          <span>${drawing.date}</span>
          <div class="gallery-actions">
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

function downloadDrawing(index) {
  const drawings = getDrawings();
  if (index < 0 || index >= drawings.length) {
    return;
  }
  const drawing = drawings[index];
  const safeDate = drawing.date
    ? drawing.date.replace(/[\W_]+/g, "-").replace(/^-+|-+$/g, "")
    : `${index + 1}`;
  const link = document.createElement("a");
  link.href = drawing.image;
  link.download = `لوحة-${safeDate}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.addEventListener("DOMContentLoaded", renderGallery);
