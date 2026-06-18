## 2024-03-20 - Missing ARIA Labels on Password Toggles
**Learning:** Across the authentication flow (Login, Reset Password), password visibility toggle buttons (using Eye/EyeOff icons) consistently lacked `aria-label` attributes. This pattern made it difficult for screen reader users to understand the purpose and current state of these interactive elements.
**Action:** Always add dynamic `aria-label`s to icon-only buttons, especially those that toggle state, ensuring the label accurately reflects what clicking the button will do (e.g., "Mostrar contraseña" vs "Ocultar contraseña").
