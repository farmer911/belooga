#!/usr/bin/env python3
import concurrent.futures
import os

BASE_DIR = "/Users/phucnguyen/Dev/Beloga"

def get_harness_banner(current_route_id, current_title, select_value):
    return f"""  <!-- ============================================== -->
  <!-- MOCKUP CONTROL BAR (HARNESS ACTIVE)            -->
  <!-- ============================================== -->
  <div class="legacy-mockup-banner">
    <div class="banner-left">
      <span class="route-badge">{current_route_id}</span>
      <strong>Legacy Mockup: <code>{current_title}</code></strong>
      <span class="status-verified"><i class="fa-solid fa-shield-check"></i> HARNESS ACTIVE</span>
      <select onchange="window.location.href=this.value" class="harness-route-select" style="margin-left: 15px; padding: 3px 10px; border-radius: 4px; font-size: 11px; background: #1e293b; color: #fff; border: 1px solid #475569; font-weight: 600;">
        <option value="index.html" {'selected' if select_value == 'index.html' else ''}>Route 01: / (Public Home)</option>
        <option value="login.html" {'selected' if select_value == 'login.html' else ''}>Route 02: /login (Login)</option>
        <option value="register.html" {'selected' if select_value == 'register.html' else ''}>Route 03: /register (Register)</option>
        <option value="forgot-password.html" {'selected' if select_value == 'forgot-password.html' else ''}>Route 04: /forgot-password (Recovery)</option>
        <option value="user.html" {'selected' if select_value == 'user.html' else ''}>Route 05: /user/:username (Candidate Profile)</option>
        <option value="update-profile.html" {'selected' if select_value == 'update-profile.html' else ''}>Route 06: /user/:username/update-profile (Edit Profile)</option>
        <option value="account-setting.html" {'selected' if select_value == 'account-setting.html' else ''}>Route 07: /user/:username/account-setting (Account Settings)</option>
        <option value="search.html" {'selected' if select_value == 'search.html' else ''}>Route 08: /user/search (Search Results)</option>
        <option value="public-profile.html" {'selected' if select_value == 'public-profile.html' else ''}>Route 09: /public/:username (Public Profile)</option>
        <option value="privacy-policy.html" {'selected' if select_value == 'privacy-policy.html' else ''}>Route 10A: /privacy-policy (Privacy Policy)</option>
        <option value="terms-and-conditions.html" {'selected' if select_value == 'terms-and-conditions.html' else ''}>Route 10B: /terms-and-conditions (Terms)</option>
        <option value="contact-us.html" {'selected' if select_value == 'contact-us.html' else ''}>Route 11: /contact-us (Contact Us)</option>
        <option value="help.html" {'selected' if select_value == 'help.html' else ''}>Route 12: /help (Help Center)</option>
        <option value="careers.html" {'selected' if select_value == 'careers.html' else ''}>Route 13: /careers (Careers)</option>
        <option value="blog.html" {'selected' if select_value == 'blog.html' else ''}>Route 14: /blog (Blog)</option>
        <option value="404.html" {'selected' if select_value == '404.html' else ''}>Route 16: /404-not-found (404 Page)</option>
      </select>
    </div>
    <div class="banner-right">
      <a href="VIOLATIONS_REGISTER.md" class="violations-link"><i class="fa-solid fa-clipboard-list"></i> VIOLATIONS_REGISTER.md</a>
    </div>
  </div>"""

def get_header(is_authenticated=False, username="Ava Morgan"):
    if not is_authenticated:
        return """  <header class="navbar-wrapper">
    <nav class="navbar container">
      <div class="nav-brand-container">
        <a href="index.html" class="nav-link nav-link-logo">
          <img src="/images/logo-big.png" class="header-logo" alt="Belooga Logo">
        </a>
      </div>
      <div class="nav-links-right">
        <a href="login.html" class="nav-auth-link">Login</a>
        <a href="register.html" class="nav-btn-register">Register</a>
      </div>
    </nav>
  </header>"""
    else:
        return f"""  <header class="navbar-wrapper authenticated-header">
    <nav class="navbar container">
      <div class="nav-brand-container">
        <a href="index.html" class="nav-link nav-link-logo">
          <img src="/images/logo-big.png" class="header-logo" alt="Belooga Logo">
        </a>
      </div>
      <div class="nav-search-bar" style="flex: 1; max-width: 400px; margin: 0 30px; position: relative;">
        <input type="text" placeholder="Search user by name, location, ..." style="width: 100%; padding: 8px 16px 8px 36px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 13px; background: #f8fafc;" onkeydown="if(event.key==='Enter') window.location.href='search.html?key='+this.value">
        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 11px; color: #94a3b8; font-size: 13px;"></i>
      </div>
      <div class="nav-links-right" style="display: flex; align-items: center; gap: 20px;">
        <a href="user.html" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #334155; font-weight: 600; font-size: 13px;">
          <img src="/images/avatar.jpg" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" alt="{username}">
          <span>{username}</span>
        </a>
        <a href="update-profile.html" title="Edit Profile" style="color: #64748b; font-size: 14px;"><i class="fa-solid fa-pen-to-square"></i></a>
        <a href="account-setting.html" title="Settings" style="color: #64748b; font-size: 14px;"><i class="fa-solid fa-gear"></i></a>
        <a href="login.html" title="Logout" style="color: #ef4444; font-size: 14px;"><i class="fa-solid fa-arrow-right-from-bracket"></i></a>
      </div>
    </nav>
  </header>"""

def get_footer():
    return """  <footer class="site-footer">
    <div class="container-custom">
      <div class="footer-row">
        <div class="footer-left">
          <span class="type--fine-print copyright-text">
            © <span class="update-year">2026</span> Belooga Beta — All Rights Reserved
          </span>
        </div>
        <div class="footer-center">
          <ul class="footer-nav-list">
            <li><a href="privacy-policy.html" class="type--fine-print">Privacy Policy</a></li>
            <li><a href="terms-and-conditions.html" class="type--fine-print">Terms and Conditions</a></li>
            <li><a href="help.html" class="type--fine-print">Help</a></li>
            <li><a href="contact-us.html" class="type--fine-print">Contact us</a></li>
            <li><a href="careers.html" class="type--fine-print">Careers</a></li>
            <li><a href="blog.html" class="type--fine-print">Blog</a></li>
          </ul>
        </div>
        <div class="footer-right">
          <div class="social-icons-group">
            <a href="#twitter" class="social-icon-circle"><i class="fa-brands fa-twitter"></i></a>
            <a href="#facebook" class="social-icon-circle"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#instagram" class="social-icon-circle"><i class="fa-brands fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </div>
  </footer>"""

def build_user_scene():
    path = os.path.join(BASE_DIR, "user.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ava Morgan — Profile Workspace | Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 05", "/user/:username", "user.html")}
{get_header(is_authenticated=True)}

  <!-- PROFILE WORKSPACE (profile.scene.tsx) -->
  <main class="profile-page-container container" style="padding: 40px 20px; max-width: 1200px;">
    
    <!-- Top Actions Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
      <div>
        <h1 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">Candidate Profile Workspace</h1>
        <span style="font-size: 13px; color: #64748b;">Public Link: <a href="public-profile.html" style="color: var(--main-color); font-weight: 600;">belooga.com/public/avamorgan</a></span>
      </div>
      <div style="display: flex; gap: 12px;">
        <a href="update-profile.html" class="btn" style="background: #fff; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none; color: #334155;"><i class="fa-solid fa-pen-to-square"></i> Edit Profile</a>
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer;" onclick="alert('Exporting PDF Resume...')"><i class="fa-solid fa-file-pdf"></i> Export Profile to PDF</button>
      </div>
    </div>

    <div class="row" style="display: grid; grid-template-columns: 320px 1fr; gap: 30px;">
      
      <!-- LEFT SIDEBAR: user-sidebar.tsx -->
      <aside class="user-sidebar-container" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); padding: 30px; border: 1px solid #e2e8f0; height: fit-content;">
        
        <!-- Avatar & Header Box -->
        <div style="background: linear-gradient(135deg, #3fc6b7, #5bbbae); border-radius: 6px; padding: 30px 20px; text-align: center; color: #fff; margin-bottom: 24px;">
          <img src="/images/avatar.jpg" style="width: 96px; height: 96px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: cover; margin-bottom: 12px;" alt="Ava Morgan">
          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #fff;">Ava Morgan</h2>
          <p style="font-size: 13px; opacity: 0.95; margin-bottom: 6px;">Digital Strategist</p>
          <span style="font-size: 12px; opacity: 0.9;"><i class="fa-solid fa-location-dot"></i> Chicago, Illinois, United States</span>
        </div>

        <!-- Contact Info -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 12px;">See Contact Info</h4>
          <div style="display: flex; gap: 12px; font-size: 16px;">
            <a href="#linkedin" style="color: #0077b5;"><i class="fa-brands fa-linkedin"></i></a>
            <a href="#facebook" style="color: #3b5998;"><i class="fa-brands fa-facebook"></i></a>
            <a href="#twitter" style="color: #00aced;"><i class="fa-brands fa-twitter"></i></a>
            <a href="#instagram" style="color: #e4405f;"><i class="fa-brands fa-instagram"></i></a>
            <a href="#website" style="color: #64748b;"><i class="fa-solid fa-globe"></i></a>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <!-- About -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">About</h4>
          <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            I'm a 25 year old digital strategist living in Chicago. I am currently completing my graduate degree at Northwestern and working for a tech startup.
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <!-- Skills -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 12px;">Skills</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span style="background: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;">SEO & SEM</span>
            <span style="background: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;">Content Marketing</span>
            <span style="background: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;">Analytics</span>
            <span style="background: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;">Brand Strategy</span>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <!-- Languages & Interests -->
        <div>
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">Languages</h4>
          <p style="font-size: 13px; color: #475569; margin-bottom: 16px;">English (Native), Spanish (Professional)</p>
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">Interests</h4>
          <p style="font-size: 13px; color: #475569;">Photography, Traveling, Design Systems</p>
        </div>

      </aside>

      <!-- RIGHT MAIN CONTENT: profile.scene.tsx -->
      <section class="user-content-area" style="display: flex; flex-direction: column; gap: 30px;">
        
        <!-- Video Resume Pitch Card -->
        <div class="block-component" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0;"><i class="fa-solid fa-video" style="color: var(--main-color); margin-right: 8px;"></i> Video Resume Pitch</h3>
            <button class="btn" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;" onclick="alert('Record or re-upload video pitch')"><i class="fa-solid fa-camera"></i> Change Video</button>
          </div>
          <div style="position: relative; background: #000; height: 380px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="alert('Playing Ava Video Resume Pitch')">
            <img src="/images/home/matt-poster.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" alt="Video Pitch">
            <div class="modal-start" style="display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
              <div class="video-play-icon" data-modal-index="0"></div>
            </div>
            <span style="position: absolute; bottom: 16px; left: 24px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;"><i class="fa-solid fa-clock"></i> 0:30 Elevator Pitch</span>
          </div>
        </div>

        <!-- Experience Timeline -->
        <div class="block-component" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0;"><i class="fa-solid fa-briefcase" style="color: var(--main-color); margin-right: 8px;"></i> Experience</h3>
            <a href="update-profile.html" style="font-size: 12px; font-weight: 700; color: var(--main-color); text-decoration: none;">+ Add Position</a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Position 1 -->
            <div style="display: flex; gap: 20px;">
              <div style="width: 48px; height: 48px; background: #e0f2fe; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #0284c7; flex-shrink: 0;">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                  <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">Senior Digital Strategist</h4>
                  <span style="font-size: 12px; color: #64748b; font-weight: 600;">Jan 2022 — Present</span>
                </div>
                <span style="font-size: 13px; color: var(--main-color); font-weight: 600;">BlueFountain Media • Full-time</span>
                <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 8px;">
                  Lead client digital strategy roadmaps across SaaS and e-commerce portfolios. Partner with UX/UI design teams to drive a 40% improvement in funnel conversion rates.
                </p>
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9;">

            <!-- Position 2 -->
            <div style="display: flex; gap: 20px;">
              <div style="width: 48px; height: 48px; background: #fef3c7; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #d97706; flex-shrink: 0;">
                <i class="fa-solid fa-bullhorn"></i>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                  <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">Content Marketing Specialist</h4>
                  <span style="font-size: 12px; color: #64748b; font-weight: 600;">Aug 2019 — Dec 2021</span>
                </div>
                <span style="font-size: 13px; color: var(--main-color); font-weight: 600;">Ogilvy Chicago • Full-time</span>
                <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 8px;">
                  Authored multi-channel editorial calendars and orchestrated video content campaigns reaching over 500k monthly views.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Education -->
        <div class="block-component" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0;"><i class="fa-solid fa-graduation-cap" style="color: var(--main-color); margin-right: 8px;"></i> Education</h3>
            <a href="update-profile.html" style="font-size: 12px; font-weight: 700; color: var(--main-color); text-decoration: none;">+ Add Education</a>
          </div>

          <div style="display: flex; gap: 20px;">
            <div style="width: 48px; height: 48px; background: #ede9fe; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #7c3aed; flex-shrink: 0;">
              <i class="fa-solid fa-building-columns"></i>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between;">
                <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">Northwestern University</h4>
                <span style="font-size: 12px; color: #64748b; font-weight: 600;">2018 — 2022</span>
              </div>
              <span style="font-size: 13px; color: var(--main-color); font-weight: 600;">B.S. in Integrated Marketing Communications</span>
              <p style="font-size: 13px; color: #475569; margin-top: 6px;">Graduated Magna Cum Laude. President of the Digital Strategy Association.</p>
            </div>
          </div>
        </div>

        <!-- Resume Attachment -->
        <div class="block-component" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 30px;">
          <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 16px;"><i class="fa-solid fa-paperclip" style="color: var(--main-color); margin-right: 8px;"></i> PDF Resume Attachment</h3>
          <div style="border: 2px dashed #cbd5e1; border-radius: 6px; padding: 30px; text-align: center; background: #f8fafc; cursor: pointer;" onclick="alert('Open file selector for PDF resume')">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 36px; color: var(--main-color); margin-bottom: 12px;"></i>
            <p style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 4px;">Drag and drop .pdf file here or browse</p>
            <span style="font-size: 12px; color: #94a3b8;">Ava_Morgan_Digital_Strategist_Resume.pdf (Uploaded, 1.2 MB)</span>
          </div>
        </div>

      </section>

    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 05 (user.html) Done"

def build_update_profile_scene():
    path = os.path.join(BASE_DIR, "update-profile.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit Profile — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 06", "/user/:username/update-profile", "update-profile.html")}
{get_header(is_authenticated=True)}

  <main class="container" style="padding: 40px 20px; max-width: 900px;">
    <div style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 40px;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 0;">Edit Candidate Profile</h1>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Update your basic details, contact channels, bio, and resume.</p>
        </div>
        <a href="user.html" class="btn" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; text-decoration: none; color: #475569;">Back to Profile</a>
      </div>

      <form onsubmit="event.preventDefault(); alert('Profile updated successfully!'); window.location.href='user.html';">
        
        <!-- Avatar Preview and Upload -->
        <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 30px;">
          <img src="/images/avatar.jpg" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--main-color);" alt="Avatar">
          <div>
            <button type="button" class="btn" style="background: #fff; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;" onclick="alert('Choose new avatar photo')"><i class="fa-solid fa-camera"></i> Change Photo</button>
            <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 6px;">Supported: JPG, PNG under 5MB.</span>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">First Name</label>
            <input type="text" value="Ava" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;" required>
          </div>
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Last Name</label>
            <input type="text" value="Morgan" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Professional Headline</label>
            <input type="text" value="Digital Strategist" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;" required>
          </div>
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Location</label>
            <input type="text" value="Chicago, Illinois, United States" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;" required>
          </div>
        </div>

        <div class="form-group text-left" style="margin-bottom: 16px;">
          <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">About Bio</label>
          <textarea rows="4" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-family: inherit;">I'm a 25 year old digital strategist living in Chicago. I am currently completing my graduate degree at Northwestern and working for a tech startup.</textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">LinkedIn URL</label>
            <input type="text" value="https://linkedin.com/in/avamorgan" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
          </div>
          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Personal Website</label>
            <input type="text" value="https://avamorgan.me" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <a href="user.html" class="btn" style="background: #f1f5f9; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 600; color: #475569; text-decoration: none;">Cancel</a>
          <button type="submit" class="btn" style="background: var(--main-color); color: #fff; padding: 10px 24px; border-radius: 4px; font-size: 13px; font-weight: 700; border: none; cursor: pointer;">Save Changes</button>
        </div>

      </form>
    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 06 (update-profile.html) Done"

def build_account_setting_scene():
    path = os.path.join(BASE_DIR, "account-setting.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Settings — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 07", "/user/:username/account-setting", "account-setting.html")}
{get_header(is_authenticated=True)}

  <main class="container" style="padding: 40px 20px; max-width: 800px;">
    <div style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 40px;">
      
      <h1 style="font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 24px;">Account Settings</h1>

      <!-- Section 1: Change Email -->
      <section style="margin-bottom: 30px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
        <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Primary Email Address</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Your email is used for notification alerts and account recovery.</p>
        <div style="display: flex; gap: 12px; max-width: 500px;">
          <input type="email" value="ava.morgan@example.com" style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
          <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; font-size: 12px; cursor: pointer;" onclick="alert('Email updated')">Update Email</button>
        </div>
      </section>

      <!-- Section 2: Change Password -->
      <section style="margin-bottom: 30px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
        <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Change Password</h3>
        <div style="max-width: 500px; display: flex; flex-direction: column; gap: 12px;">
          <input type="password" placeholder="Current password" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
          <input type="password" placeholder="New password" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
          <input type="password" placeholder="Confirm new password" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
          <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; font-size: 12px; width: fit-content; cursor: pointer;" onclick="alert('Password updated')">Change Password</button>
        </div>
      </section>

      <!-- Section 3: Danger Zone -->
      <section>
        <h3 style="font-size: 15px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">Delete Account</h3>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Permanently remove your candidate profile, uploaded videos, and resumes from Belooga.</p>
        <button class="btn" style="background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; padding: 8px 18px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer;" onclick="if(confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) alert('Account scheduled for deletion.');">Delete My Account</button>
      </section>

    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 07 (account-setting.html) Done"

def build_search_scene():
    path = os.path.join(BASE_DIR, "search.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Search Results — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 08", "/user/search/?key=&page=", "search.html")}
{get_header(is_authenticated=True)}

  <main class="container" style="padding: 40px 20px; max-width: 1140px;">
    
    <!-- Search Bar Section -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Discover Top Candidates</h1>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Browse candidates with 30-second video introductions.</p>
      
      <div style="max-width: 600px; margin: 0 auto; display: flex; gap: 10px;">
        <input type="text" id="search-input" value="Strategist" placeholder="Search by role, skill, or location..." style="flex: 1; padding: 12px 18px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px;">
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 13px; cursor: pointer;">Search</button>
      </div>
    </div>

    <!-- Search Count Banner -->
    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 14px; font-weight: 700; color: #475569;">Showing 3 verified candidates</span>
      <span style="font-size: 12px; color: #94a3b8;">Sorted by Relevance</span>
    </div>

    <!-- Results Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-bottom: 40px;">
      
      <!-- Candidate Card 1 -->
      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); overflow: hidden; display: flex; flex-direction: column;">
        <div style="height: 160px; position: relative; background: #000;">
          <img src="/images/home/matt-poster.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" alt="Ava Morgan Video">
          <span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-play"></i> 0:30 Video</span>
        </div>
        <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <img src="/images/avatar.jpg" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="Ava">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0;"><a href="public-profile.html" style="color: inherit; text-decoration: none;">Ava Morgan</a></h3>
              <span style="font-size: 12px; color: var(--main-color); font-weight: 600;">Digital Strategist</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 14px;">Graduate degree from Northwestern. 4+ years leading digital advertising campaigns.</p>
          <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9;">
            <span style="font-size: 11px; color: #94a3b8;"><i class="fa-solid fa-location-dot"></i> Chicago, IL</span>
            <a href="public-profile.html" class="btn" style="background: var(--main-color); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-decoration: none;">View Profile</a>
          </div>
        </div>
      </div>

      <!-- Candidate Card 2 -->
      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); overflow: hidden; display: flex; flex-direction: column;">
        <div style="height: 160px; position: relative; background: #000;">
          <img src="/images/home/Jeremy-1.jpg" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" alt="Jeremy">
          <span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-play"></i> 0:30 Video</span>
        </div>
        <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <img src="/images/home/Jeremy-1.jpg" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="Jeremy">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0;">Jeremy Vance</h3>
              <span style="font-size: 12px; color: var(--main-color); font-weight: 600;">Product Manager</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 14px;">Specialized in technical B2B platforms, user onboarding flows, and growth experiments.</p>
          <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9;">
            <span style="font-size: 11px; color: #94a3b8;"><i class="fa-solid fa-location-dot"></i> San Francisco, CA</span>
            <a href="public-profile.html" class="btn" style="background: var(--main-color); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-decoration: none;">View Profile</a>
          </div>
        </div>
      </div>

      <!-- Candidate Card 3 -->
      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); overflow: hidden; display: flex; flex-direction: column;">
        <div style="height: 160px; position: relative; background: #000;">
          <img src="/images/home/Jazmin-1.jpg" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" alt="Jazmin">
          <span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-play"></i> 0:30 Video</span>
        </div>
        <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <img src="/images/home/Jazmin-1.jpg" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="Jazmin">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0;">Jazmin Cole</h3>
              <span style="font-size: 12px; color: var(--main-color); font-weight: 600;">Creative Director</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 14px;">Award-winning visual storyteller with 7+ years directing international brand campaigns.</p>
          <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9;">
            <span style="font-size: 11px; color: #94a3b8;"><i class="fa-solid fa-location-dot"></i> New York, NY</span>
            <a href="public-profile.html" class="btn" style="background: var(--main-color); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-decoration: none;">View Profile</a>
          </div>
        </div>
      </div>

    </div>

    <!-- Pagination -->
    <div style="display: flex; justify-content: center; gap: 8px;">
      <button class="btn" style="background: var(--main-color); color: #fff; border: none; width: 36px; height: 36px; border-radius: 4px; font-weight: 700;">1</button>
      <button class="btn" style="background: #fff; border: 1px solid #cbd5e1; color: #334155; width: 36px; height: 36px; border-radius: 4px; font-weight: 600;">2</button>
      <button class="btn" style="background: #fff; border: 1px solid #cbd5e1; color: #334155; width: 36px; height: 36px; border-radius: 4px; font-weight: 600;"><i class="fa-solid fa-chevron-right"></i></button>
    </div>

  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 08 (search.html) Done"

def build_public_profile_scene():
    path = os.path.join(BASE_DIR, "public-profile.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ava Morgan — Candidate Profile | Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 09", "/public/:username", "public-profile.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 40px 20px; max-width: 1200px;">
    
    <!-- Public Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
      <div>
        <span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Public Candidate View</span>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn" style="background: #fff; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;" onclick="alert('Profile report submitted to moderators.')"><i class="fa-solid fa-flag"></i> Report Profile</button>
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer;" onclick="alert('Exporting PDF...')"><i class="fa-solid fa-file-pdf"></i> Export Profile to PDF</button>
      </div>
    </div>

    <div class="row" style="display: grid; grid-template-columns: 320px 1fr; gap: 30px;">
      
      <!-- Public Sidebar -->
      <aside class="user-sidebar-container" style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); padding: 30px; border: 1px solid #e2e8f0; height: fit-content;">
        <div style="background: linear-gradient(135deg, #3fc6b7, #5bbbae); border-radius: 6px; padding: 30px 20px; text-align: center; color: #fff; margin-bottom: 24px;">
          <img src="/images/avatar.jpg" style="width: 96px; height: 96px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: cover; margin-bottom: 12px;" alt="Ava Morgan">
          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #fff;">Ava Morgan</h2>
          <p style="font-size: 13px; opacity: 0.95; margin-bottom: 6px;">Digital Strategist</p>
          <span style="font-size: 12px; opacity: 0.9;"><i class="fa-solid fa-location-dot"></i> Chicago, Illinois, United States</span>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 12px;">Contact Links</h4>
          <div style="display: flex; gap: 12px; font-size: 16px;">
            <a href="#linkedin" style="color: #0077b5;"><i class="fa-brands fa-linkedin"></i></a>
            <a href="#facebook" style="color: #3b5998;"><i class="fa-brands fa-facebook"></i></a>
            <a href="#website" style="color: #64748b;"><i class="fa-solid fa-globe"></i></a>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <div>
          <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px;">About</h4>
          <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            I'm a 25 year old digital strategist living in Chicago. Completing my graduate degree at Northwestern and working for a tech startup.
          </p>
        </div>
      </aside>

      <!-- Public Main Content -->
      <section style="display: flex; flex-direction: column; gap: 30px;">
        
        <!-- Video Pitch -->
        <div style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="position: relative; background: #000; height: 380px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="alert('Playing candidate video resume')">
            <img src="/images/home/matt-poster.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;" alt="Ava Pitch">
            <div class="modal-start" style="display: block; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
              <div class="video-play-icon" data-modal-index="0"></div>
            </div>
            <span style="position: absolute; bottom: 16px; left: 24px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;"><i class="fa-solid fa-play"></i> 0:30 Video Resume</span>
          </div>
        </div>

        <!-- Experience -->
        <div style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 30px;">
          <h3 style="font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 24px;"><i class="fa-solid fa-briefcase" style="color: var(--main-color); margin-right: 8px;"></i> Professional Experience</h3>
          <div>
            <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">Senior Digital Strategist — BlueFountain Media</h4>
            <span style="font-size: 12px; color: #64748b;">Jan 2022 — Present • Chicago, IL</span>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 8px;">Lead digital strategy roadmaps across multi-million dollar client portfolios.</p>
          </div>
        </div>

      </section>

    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 09 (public-profile.html) Done"

def build_contact_us_scene():
    path = os.path.join(BASE_DIR, "contact-us.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 11", "/contact-us", "contact-us.html")}
{get_header(is_authenticated=False)}

  <main style="padding: 60px 0; background: var(--bg-page); min-height: calc(100vh - 200px);">
    <div class="container" style="max-width: 760px;">
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Contact Us</h1>
        <p style="font-size: 15px; color: #64748b;">Ask a question, leave a comment, or report an issue.</p>
      </div>

      <div style="background: #fff; border-radius: 6px; box-shadow: var(--box-shadow-card); border: 1px solid #e2e8f0; padding: 40px;">
        <form onsubmit="event.preventDefault(); alert('Thank you! Your message has been sent to the Belooga team.'); this.reset();">
          <div class="form-grid-2">
            <div class="form-group text-left">
              <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Your Name</label>
              <input type="text" placeholder="John Doe" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
            </div>
            <div class="form-group text-left">
              <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Email Address</label>
              <input type="email" placeholder="john@example.com" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
            </div>
          </div>

          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Subject</label>
            <input type="text" placeholder="Topic or Question" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; margin-bottom: 16px;">
          </div>

          <div class="form-group text-left">
            <label style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">Message</label>
            <textarea rows="5" placeholder="How can we help you?" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; font-family: inherit; margin-bottom: 20px;"></textarea>
          </div>

          <button type="submit" class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 12px 28px; border-radius: 4px; font-weight: 700; font-size: 14px; cursor: pointer;">Send Message</button>
        </form>
      </div>

    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 11 (contact-us.html) Done"

def build_help_scene():
    path = os.path.join(BASE_DIR, "help.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Help Center & FAQs — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 12", "/help", "help.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 50px 20px; max-width: 900px;">
    
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Belooga Help Center</h1>
      <p style="font-size: 15px; color: #64748b;">Frequently asked questions and guides to recording your video resume.</p>
    </div>

    <!-- Quick Navigation Cards -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
      <div style="background: #fff; border-radius: 6px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); text-align: center;">
        <i class="fa-solid fa-circle-question" style="font-size: 32px; color: var(--main-color); margin-bottom: 12px;"></i>
        <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">General FAQs</h3>
        <p style="font-size: 13px; color: #64748b;">Common inquiries regarding account setup, privacy, and sharing.</p>
      </div>
      <div style="background: #fff; border-radius: 6px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); text-align: center;">
        <i class="fa-solid fa-video" style="font-size: 32px; color: var(--main-color); margin-bottom: 12px;"></i>
        <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Video Tutorials</h3>
        <p style="font-size: 13px; color: #64748b;">Step-by-step guidance on recording your 30-second elevator pitch.</p>
      </div>
    </div>

    <!-- FAQ Accordion -->
    <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: var(--box-shadow-card);">
      <h2 style="font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 20px;">Top Questions</h2>

      <details style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;" open>
        <summary style="font-weight: 700; font-size: 14px; color: #1e293b; cursor: pointer; margin-bottom: 8px;">What is a Belooga video resume?</summary>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">A 30-second high-impact elevator pitch video paired directly with your traditional professional experience, allowing hiring managers to evaluate communication skills instantly.</p>
      </details>

      <details style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <summary style="font-weight: 700; font-size: 14px; color: #1e293b; cursor: pointer; margin-bottom: 8px;">How do I record my video?</summary>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">You can use Belooga's built-in web camera recorder or upload any pre-recorded MP4/WebM video file from your computer or phone.</p>
      </details>

      <details style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <summary style="font-weight: 700; font-size: 14px; color: #1e293b; cursor: pointer; margin-bottom: 8px;">Can I keep my profile private?</summary>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">Yes. You can toggle public sharing on and off at any time from your Account Settings.</p>
      </details>
    </div>

  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 12 (help.html) Done"

def build_careers_scene():
    path = os.path.join(BASE_DIR, "careers.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Careers at Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 13", "/careers", "careers.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 50px 20px; max-width: 960px;">
    
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px;">Join the Belooga Mission</h1>
      <p style="font-size: 15px; color: #64748b;">Help us reinvent how candidates present themselves to employers worldwide.</p>
    </div>

    <!-- Job Openings List -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: var(--box-shadow-card); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Senior Full Stack Engineer (React / Python)</h3>
          <span style="font-size: 13px; color: #64748b;">Engineering • Remote / Chicago • Full-time</span>
        </div>
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 700; font-size: 12px; cursor: pointer;" onclick="alert('Application modal opened')">Apply Now</button>
      </div>

      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: var(--box-shadow-card); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Product Growth Manager</h3>
          <span style="font-size: 13px; color: #64748b;">Product • Chicago, IL • Full-time</span>
        </div>
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 700; font-size: 12px; cursor: pointer;" onclick="alert('Application modal opened')">Apply Now</button>
      </div>

      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: var(--box-shadow-card); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Customer Success & Talent Specialist</h3>
          <span style="font-size: 13px; color: #64748b;">Operations • Remote • Full-time</span>
        </div>
        <button class="btn" style="background: var(--main-color); color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 700; font-size: 12px; cursor: pointer;" onclick="alert('Application modal opened')">Apply Now</button>
      </div>

    </div>

  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 13 (careers.html) Done"

def build_blog_scene():
    path = os.path.join(BASE_DIR, "blog.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog & Insights — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 14", "/blog", "blog.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 40px 20px; max-width: 1140px;">
    
    <!-- Featured Blog Banner -->
    <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); overflow: hidden; margin-bottom: 40px; display: grid; grid-template-columns: 1fr 1fr; align-items: center;">
      <img src="/images/blog/banner-blog.png" style="width: 100%; height: 320px; object-fit: cover;" alt="Featured Blog">
      <div style="padding: 40px;">
        <span style="color: var(--main-color); font-weight: 700; font-size: 12px; text-transform: uppercase;">Featured Guide</span>
        <h2 style="font-size: 22px; font-weight: 800; color: #1e293b; margin: 10px 0 14px;">How to Nail Your 30-Second Elevator Pitch Video</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 18px;">Expert advice on lighting, body language, and concise narrative structure to stand out in front of employers.</p>
        <span style="font-size: 12px; color: #94a3b8;">5 min read • October 2026</span>
      </div>
    </div>

    <!-- Blog Posts Grid -->
    <h3 style="font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 24px;">Latest Articles</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
      
      <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: var(--box-shadow-card); overflow: hidden;">
        <img src="/images/blog-1.jpg" style="width: 100%; height: 180px; object-fit: cover;" alt="Blog post">
        <div style="padding: 20px;">
          <span style="color: var(--main-color); font-weight: 700; font-size: 11px; text-transform: uppercase;">Job Search Strategy</span>
          <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 8px 0;">Why Video Resumes Cut Hiring Times by 50%</h4>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Data insights from recruiters on evaluating candidate personality before the first interview.</p>
        </div>
      </div>

    </div>

  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 14 (blog.html) Done"

def build_legal_scenes():
    # Privacy Policy
    p_path = os.path.join(BASE_DIR, "privacy-policy.html")
    p_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 10A", "/privacy-policy", "privacy-policy.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 50px 20px; max-width: 850px;">
    <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: var(--box-shadow-card);">
      <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin-bottom: 20px;">Belooga Privacy Policy</h1>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Last Updated: October 2026</p>
      
      <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px;">1. Information We Collect</h3>
      <p style="font-size: 13px; line-height: 1.7; color: #475569;">When you register for a Belooga account, create a candidate profile, upload a video introduction or resume attachment, we collect your personal and career details.</p>

      <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px;">2. How We Use Your Data</h3>
      <p style="font-size: 13px; line-height: 1.7; color: #475569;">Your profile information is used to present your candidate qualifications to authorized employers and across your public profile link when enabled.</p>
    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(p_path, "w") as f:
        f.write(p_html)

    # Terms & Conditions
    t_path = os.path.join(BASE_DIR, "terms-and-conditions.html")
    t_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms and Conditions — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 10B", "/terms-and-conditions", "terms-and-conditions.html")}
{get_header(is_authenticated=False)}

  <main class="container" style="padding: 50px 20px; max-width: 850px;">
    <div style="background: #fff; border-radius: 6px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: var(--box-shadow-card);">
      <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin-bottom: 20px;">Terms and Conditions of Use</h1>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Effective Date: October 2026</p>
      
      <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px;">1. User Obligations</h3>
      <p style="font-size: 13px; line-height: 1.7; color: #475569;">By creating an account, candidates agree that all educational, employment, and video content uploaded represents authentic, truthful information.</p>
    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(t_path, "w") as f:
        f.write(t_html)
    return "Route 10A & 10B (privacy-policy.html & terms-and-conditions.html) Done"

def build_not_found_scene():
    path = os.path.join(BASE_DIR, "404.html")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 Page Not Found — Belooga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="index.css">
</head>
<body class="home-scene">
{get_harness_banner("ROUTE 16", "/404-not-found", "404.html")}
{get_header(is_authenticated=False)}

  <main style="min-height: calc(100vh - 200px); display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; background: #0f172a; color: #fff;">
    <div>
      <h1 style="font-size: 96px; font-weight: 900; color: var(--main-color); margin: 0; line-height: 1;">404</h1>
      <p class="lead" style="font-size: 18px; color: #cbd5e1; margin: 16px 0 24px;">The page you were looking for was not found.</p>
      <a href="index.html" class="btn" style="background: var(--main-color); color: #fff; padding: 12px 28px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 14px;">Go back to home page</a>
    </div>
  </main>

{get_footer()}
</body>
</html>"""
    with open(path, "w") as f:
        f.write(html)
    return "Route 16 (404.html) Done"

def main():
    workers = [
        ("SubAgent-UserWorkspace", build_user_scene),
        ("SubAgent-UpdateProfile", build_update_profile_scene),
        ("SubAgent-AccountSettings", build_account_setting_scene),
        ("SubAgent-Search", build_search_scene),
        ("SubAgent-PublicProfile", build_public_profile_scene),
        ("SubAgent-ContactUs", build_contact_us_scene),
        ("SubAgent-Help", build_help_scene),
        ("SubAgent-Careers", build_careers_scene),
        ("SubAgent-Blog", build_blog_scene),
        ("SubAgent-Legal", build_legal_scenes),
        ("SubAgent-NotFound", build_not_found_scene)
    ]
    
    print(f"Launching {len(workers)} parallel sub-agents...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(workers)) as executor:
        futures = {executor.submit(fn): name for name, fn in workers}
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                res = future.result()
                print(f"[{name}] Completed: {res}")
            except Exception as e:
                print(f"[{name}] ERROR: {e}")

if __name__ == "__main__":
    main()
