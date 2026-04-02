# 🚀 Quick Start Guide

## Get Your Business Calculator Running in 3 Steps!

### Step 1: Install Dependencies ⚡
```bash
cd /workspaces/onetwo/business-calculator
npm install
```

### Step 2: Start Development Server 🔥
```bash
npm run dev
```

### Step 3: Open in Browser 🌐
Visit: [http://localhost:3000](http://localhost:3000)

---

## ✅ What You'll See

### Home Page
- **Hero Section:** "All Business Calculators in One Place"
- **Search Bar:** Quick calculator search
- **Popular Calculators:** 6 featured calculators
- **8 Categories:** Click any category to explore
- **Chat Calc AI:** Bottom-right floating button

### Working Calculators (Try These!)
1. **EMI Calculator** - `/calculators/emi`
2. **SIP Calculator** - `/calculators/sip`
3. **GST Calculator** - `/calculators/gst`
4. **Compound Interest** - `/calculators/compound-interest`
5. **Discount Calculator** - `/calculators/discount`
6. **Percentage Calculator** - `/calculators/percentage`

---

## 🎯 Quick Test Checklist

- [ ] Home page loads correctly
- [ ] Search bar in header works
- [ ] Click on a category
- [ ] Open EMI Calculator
- [ ] Enter loan details and see results
- [ ] View the chart visualization
- [ ] Click Chat Calc AI button
- [ ] Try mobile responsive view

---

## 🐛 If Something Goes Wrong

### Problem: Module not found errors
**Solution:** 
```bash
npm install
```

### Problem: Port 3000 already in use
**Solution:**
```bash
# Use different port
npm run dev -- -p 3001
```

### Problem: TypeScript errors
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 More Information

- **Full Documentation:** See `README.md`
- **Setup Guide:** See `SETUP.md`  
- **Project Details:** See `PROJECT_SUMMARY.md`

---

## 🎨 Try These Features

### 1. Search Functionality
- Type "EMI" in search bar
- Click suggested calculator

### 2. Calculator Navigation  
- Home → Categories → Financial → EMI Calculator
- Use breadcrumb to go back

### 3. Chat AI Assistant
- Click floating button
- Ask: "How does EMI work?"
- Get instant explanation

### 4. Mobile Experience
- Resize browser window
- Click hamburger menu
- Navigate on mobile

---

## 🚀 Production Build (Optional)

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Project Statistics

- **Total Calculators:** 60+ (6 working, 54 ready to implement)
- **Categories:** 8
- **Components:** 8 reusable
- **Pages:** 11
- **Tech Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS

---

## 🎯 Success!

If you see the home page with calculators, **you're all set!** 🎉

**Happy Calculating!** 🧮

---

**Need Help?** Check the detailed guides in the project root:
- `README.md` - Complete documentation
- `SETUP.md` - Detailed setup instructions
- `PROJECT_SUMMARY.md` - Full project overview
