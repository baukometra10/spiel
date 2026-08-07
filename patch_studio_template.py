from pathlib import Path
path = Path('studio.html')
text = path.read_text(encoding='utf-8')
old = "<div id=\"confettiContainer\" class=\"confetti-container\"></div>\n\n<p>\nأهلاً يا <span id=\"name\"></span> 🌸\n</p>\n\n\n\n<input \ntype=\"file\"\nid=\"upload\"\naccept=\"image/*\">\n\n\n<div class=\"toolbar\">\n"
new = "<div id=\"confettiContainer\" class=\"confetti-container\"></div>\n\n<p>\nأهلاً يا <span id=\"name\"></span> 🌸\n</p>\n\n<div class=\"panel-group\">\n  <h3>رسومات جاهزة للتلوين</h3>\n  <div class=\"template-buttons\">\n    <button type=\"button\" class=\"button-small\" onclick=\"loadTemplate('flower.png')\">🌸 زهرة</button>\n    <button type=\"button\" class=\"button-small\" onclick=\"loadTemplate('butterfly.png')\">🦋 فراشة</button>\n    <button type=\"button\" class=\"button-small\" onclick=\"loadTemplate('cat.png')\">🐱 قطة</button>\n    <button type=\"button\" class=\"button-small\" onclick=\"loadTemplate('castle.png')\">🏰 قلعة</button>\n    <button type=\"button\" class=\"button-small\" onclick=\"loadTemplate('unicorn.png')\">🦄 يونيكورن</button>\n  </div>\n  <p class=\"help-text\">أو يمكنك رفع صورة من جهازك لتلوينها.</p>\n  <label for=\"upload\" class=\"button-small\">📤 رفع صورة للتلوين</label>\n  <input type=\"file\" id=\"upload\" accept=\"image/*\" style=\"display:none\">\n</div>\n\n<div class=\"toolbar\">\n"
if old not in text:
    raise SystemExit('Old block not found.')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Patched studio.html')
