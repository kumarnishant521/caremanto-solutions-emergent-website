CAREMANTO LOGO — Drop-in slot
=============================

To swap the placeholder SVG monogram for the official brand mark:

1. Save your logo file as:
     /app/frontend/public/caremanto-logo.png
   (PNG or SVG both work; SVG preferred for retina crispness — name it
   caremanto-logo.svg and the header will pick it up.)

2. Recommended specs
   - Format:      SVG (vector) or transparent PNG
   - Aspect:      Roughly square or slight landscape (fits a 44×44 slot)
   - Colour:      Single-colour mark (white / gold / neutral) — the header
                  is dark so a light or gold mark reads best
   - Padding:     Bake in your own safe area — nothing extra will be added

3. The Nav component (src/components/Nav.jsx) will automatically use the
   image if it is present. No code changes required.

4. If you also want to remove the "CAREMANTO" wordmark next to the logo
   (i.e. use only the mark), open src/components/Nav.jsx and remove the
   <span className="font-wordmark …">CAREMANTO</span> block.
