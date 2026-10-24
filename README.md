# Neha Book Publication - Frontend Clone

Exact replica of [Neha Book Publication | Work From Home Handwriting Job](https://www.nehabookpublication.in/).

## 📁 Project Structure

```
neha-book-publication/
├── index.html            # Main website homepage (Identical structure & sections)
├── style.css             # Complete responsive styling & animations
├── script.js             # Interactive behavior, fraud alert modal, FAQ accordion, scroll reveals
├── supabase-client.js    # Supabase backend client configuration
├── admin.html            # Admin dashboard for managing plans & contact numbers
├── admin.js              # Admin authentication & data management logic
├── logo.png              # Neha Book Publication official logo
├── favicon.png           # Website favicon
├── hero-banner.jpg       # Work from home hero banner
└── whatsapp.png          # WhatsApp floating chat icon
```

## 🚀 How to Run Locally

You can run this project locally using Python's built-in web server:

```bash
cd "C:\Users\RaM\.gemini\antigravity-ide\scratch\neha-book-publication"
python -m http.server 3000
```

Then open your browser and navigate to:
- **Homepage:** `http://localhost:3000/`
- **Admin Panel:** `http://localhost:3000/admin.html`

## ✨ Features Implemented
1. **Timed Fraud Alert Modal (Popup):** Automatically triggers 3 seconds after page load. Includes bilingual English & Hindi tabs, backdrop dismissal, and alert details against fraudulent social accounts.
2. **Dynamic Plans & Fallback Support:** Integrated with live Supabase database for dynamic pricing plans, with built-in instant fallback (7-Day, 10-Day, 12-Day, 15-Day plans) ensuring zero empty states.
3. **Interactive FAQ Accordion:** Clean animated toggle (+ / −) with single-expanded item state.
4. **Mobile Navigation:** Responsive hamburger menu with smooth slide-in transition and auto-close on selection.
5. **Scroll Reveals:** IntersectionObserver transitions across cards, statistics, reviews, and trust indicators.
6. **Direct WhatsApp & Telegram Integration:** Direct click-to-chat links with prefilled messages for application processing.
