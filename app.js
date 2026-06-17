document.addEventListener('DOMContentLoaded', () => {
    // State management
    let promptsData = [];
    let filteredPrompts = [];
    let activePrompt = null;
    let currentCategory = 'Career';
    let currentPage = 1;
    const itemsPerPage = 5;

    // Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const keywordFilter = document.getElementById('prompt-keyword-filter');
    const resultsCount = document.getElementById('count-number');
    const itemsContainer = document.getElementById('prompt-items-container');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const activeWorkspace = document.getElementById('active-workspace');
    
    const activeCode = document.getElementById('active-code');
    const activeTitle = document.getElementById('active-title');
    const activeSubject = document.getElementById('active-subject');
    const activeTimestamp = document.getElementById('active-timestamp');
    const activeDescription = document.getElementById('active-description');
    const activeApplication = document.getElementById('active-application');
    
    const promptPreview = document.getElementById('prompt-preview');
    const btnCopyPrompt = document.getElementById('btn-copy-prompt');
    
    const activeImage = document.getElementById('active-image');
    const activeImageLink = document.getElementById('active-image-link');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    const toastMessage = document.getElementById('toast-message');

    // Sidebar buttons
    const categoryButtons = document.querySelectorAll('.cat-btn');

    // Pagination controls
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const pageIndicator = document.getElementById('page-indicator');

    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 1. Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    });

    // 2. Load Local Data from database.js
    if (typeof promptsDatabase !== 'undefined') {
        promptsData = promptsDatabase;
        
        // Setup category switching event listeners
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                const selectedCat = targetBtn.dataset.category;
                if (selectedCat === currentCategory) return;
                
                currentCategory = selectedCat;
                
                // Update active class on sidebar buttons
                categoryButtons.forEach(b => b.classList.remove('active'));
                targetBtn.classList.add('active');
                
                // Reset keyword filter to 'all'
                keywordFilter.value = 'all';
                
                // Re-filter and render list
                applyFiltersAndReset();
            });
        });

        // Setup Back to Home button listener
        const btnGoHome = document.getElementById('btn-go-home');
        if (btnGoHome) {
            btnGoHome.addEventListener('click', () => {
                // Reset category to 'Career'
                currentCategory = 'Career';
                categoryButtons.forEach(b => {
                    if (b.dataset.category === 'Career') {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
                
                // Reset keyword filter to 'all'
                keywordFilter.value = 'all';
                
                // Re-filter and render list
                applyFiltersAndReset();
                
                // Reset right panel (show welcome screen)
                activePrompt = null;
                welcomeScreen.classList.remove('hidden');
                activeWorkspace.classList.add('hidden');
                
                // Remove active styling from any prompt items
                document.querySelectorAll('.prompt-item-card').forEach(card => {
                    card.classList.remove('active');
                });
            });
        }

        // Apply initial filters
        applyFiltersAndReset();
        
        keywordFilter.addEventListener('change', handleFilterChange);
    } else {
        console.error('Error: promptsDatabase not found!');
        itemsContainer.innerHTML = '<div class="loading-spinner">เกิดข้อผิดพลาดในการโหลดข้อมูล (ไม่พบฐานข้อมูล)</div>';
    }

    // Dynamic keyword classifier
    function getItemKeywords(item) {
        const text = `${item.Title} ${item.Description} ${item.Recipe || ''} ${item.MasterPrompt} ${item.Subject}`.toLowerCase();
        const keywords = ['all'];
        
        if (text.includes('dashboard') || text.includes('scorecard') || text.includes('แดชบอร์ด') || text.includes('ประเมินความถนัด')) {
            keywords.push('dashboard');
        }
        if (text.includes('starter pack') || text.includes('starterpack') || text.includes('เครื่องมือประจำสายอาชีพ') || text.includes('action figure') || text.includes('ของเล่น')) {
            keywords.push('starterpack');
        }
        if (text.includes('package') || text.includes('packaging') || text.includes('บรรจุภัณฑ์') || text.includes('กล่อง')) {
            keywords.push('packaging');
        }
        if (text.includes('pose') || text.includes('poses') || text.includes('ท่าทาง') || text.includes('โพสท่า')) {
            keywords.push('pose');
        }
        if (text.includes('crayon') || text.includes('สีเทียน') || text.includes('วาดเขียน') || text.includes('เด็ก')) {
            keywords.push('crayon');
        }
        if (text.includes('lanna') || text.includes('ล้านนา') || text.includes('บ่อสร้าง') || text.includes('ร่ม') || text.includes('หัตถกรรม')) {
            keywords.push('lanna');
        }
        return keywords;
    }

    // Apply filters and reset pagination
    function applyFiltersAndReset() {
        const selectedKeyword = keywordFilter.value;
        
        filteredPrompts = promptsData.filter(item => {
            if (item.Category !== currentCategory) return false;
            
            const keywords = getItemKeywords(item);
            return keywords.includes(selectedKeyword);
        });
        
        currentPage = 1;
        
        // Hide workspace if active prompt is in a different category now
        if (activePrompt && activePrompt.Category !== currentCategory) {
            activePrompt = null;
            welcomeScreen.classList.remove('hidden');
            activeWorkspace.classList.add('hidden');
        }
        
        renderPromptList();
    }

    // 3. Handle Filter Change
    function handleFilterChange() {
        applyFiltersAndReset();
    }

    // 4. Render list of prompts with pagination
    function renderPromptList() {
        itemsContainer.innerHTML = '';
        resultsCount.textContent = filteredPrompts.length;

        if (filteredPrompts.length === 0) {
            itemsContainer.innerHTML = '<div class="loading-spinner">ไม่พบรายการที่ตรงกับตัวกรอง</div>';
            updatePaginationControls(0);
            return;
        }

        const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredPrompts.slice(start, end);

        pageItems.forEach(item => {
            const card = document.createElement('div');
            card.className = `prompt-item-card ${activePrompt && activePrompt.Code === item.Code ? 'active' : ''}`;
            card.dataset.code = item.Code;
            card.innerHTML = `
                <span class="item-code">${item.Code}</span>
                <h4 class="item-title">${item.Title}</h4>
                <div class="item-subject">${item.Subject}</div>
            `;
            
            card.addEventListener('click', () => selectPrompt(item));
            itemsContainer.appendChild(card);
        });

        // Ensure active card has active class even on pagination change
        if (activePrompt) {
            const activeCard = itemsContainer.querySelector(`[data-code="${activePrompt.Code}"]`);
            if (activeCard) {
                activeCard.classList.add('active');
            }
        }

        updatePaginationControls(totalPages);
    }

    // 5. Update Pagination Buttons & State
    function updatePaginationControls(totalPages) {
        if (totalPages <= 1) {
            pageIndicator.textContent = `หน้า ${currentPage} / ${totalPages || 1}`;
            btnPrevPage.disabled = true;
            btnNextPage.disabled = true;
            return;
        }

        pageIndicator.textContent = `หน้า ${currentPage} / ${totalPages}`;
        btnPrevPage.disabled = (currentPage === 1);
        btnNextPage.disabled = (currentPage === totalPages);
    }

    // Pagination Click Listeners
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPromptList();
            itemsContainer.scrollTop = 0;
        }
    });

    btnNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPromptList();
            itemsContainer.scrollTop = 0;
        }
    });

    // 6. Select a Prompt
    function selectPrompt(item) {
        activePrompt = item;
        
        // Highlight in list
        document.querySelectorAll('.prompt-item-card').forEach(card => {
            if (card.dataset.code === item.Code) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Hide welcome screen, show workspace
        welcomeScreen.classList.add('hidden');
        activeWorkspace.classList.remove('hidden');

        // Set content
        activeCode.textContent = item.Code;
        activeTitle.textContent = item.Title;
        activeSubject.textContent = item.Subject;
        activeTimestamp.textContent = item.Timestamp || 'ไม่มีข้อมูลบันทึก';
        activeDescription.textContent = item.Description;
        
        // Set application guidelines
        activeApplication.innerHTML = formatApplicationText(item.Application);

        // Handle image preview with smooth transition loading
        if (item.ExampleImage && item.ExampleImage.trim() !== '') {
            imagePreviewContainer.classList.remove('hidden');
            activeImage.src = item.ExampleImage;
            activeImageLink.href = item.ExampleImage;
        } else {
            imagePreviewContainer.classList.add('hidden');
        }

        // Display raw prompt in preview
        promptPreview.textContent = item.MasterPrompt;
    }

    // Format application text (converting bullets into lists)
    function formatApplicationText(appText) {
        if (!appText) return 'ไม่มีแนวทางเสริมเพิ่มเติม';
        const lines = appText.split('•').map(line => line.trim()).filter(line => line !== '');
        if (lines.length <= 1) return appText;
        
        return `<ul style="list-style-type: disc; margin-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
            ${lines.map(line => `<li>${line}</li>`).join('')}
        </ul>`;
    }

    // 7. Registration & Copy Control
    // URL สำหรับส่งข้อมูลไปยัง Google Sheet (ผู้ใช้จะต้องนำ Web App URL จาก Google Apps Script มาใส่ตรงนี้)
    const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwPIUxRE558a2rvRGqmKvPcpEToOKsvL1XwJRVk7k99x83dPnFNX4xhBHzJtD6GgYSR/exec"; 

    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSubmitRegister = document.getElementById('btn-submit-register');
    
    let registrationCallback = null;

    // ตรวจสอบสถานะการลงทะเบียนจาก sessionStorage (เมื่อปิดหน้าต่าง/แท็บ ข้อมูลจะรีเซ็ตและต้องลงทะเบียนใหม่)
    function isUserRegistered() {
        return sessionStorage.getItem('prompt_user_registered') === 'true';
    }

    // ฟังก์ชันเปิด Modal ลงทะเบียน
    function showRegistrationModal(callback) {
        registrationCallback = callback;
        registerModal.classList.remove('hidden');
    }

    // ฟังก์ชันปิด Modal ลงทะเบียน
    function hideRegistrationModal() {
        registerModal.classList.add('hidden');
        registrationCallback = null;
        registerForm.reset();
    }

    // ปุ่มยกเลิก
    btnCloseModal.addEventListener('click', hideRegistrationModal);

    // เมื่อส่งฟอร์มลงทะเบียน
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const school = document.getElementById('reg-school').value.trim();
        const affiliation = document.getElementById('reg-affiliation').value.trim();
        const purpose = document.getElementById('reg-purpose').value.trim();
        
        btnSubmitRegister.disabled = true;
        btnSubmitRegister.textContent = 'กำลังลงทะเบียน...';
        
        // ส่งข้อมูลแบบ FormData ไปยัง Google Apps Script (ใช้ no-cors เพื่อไม่ให้ติดปัญหา CORS บล็อก)
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('school', school);
        formData.append('affiliation', affiliation);
        formData.append('purpose', purpose);
        
        fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        })
        .then(() => {
            // บันทึกสถานะการลงทะเบียนไว้ชั่วคราวในเซสชันนี้
            sessionStorage.setItem('prompt_user_registered', 'true');
            hideRegistrationModal();
            
            // ดำเนินการคัดลอกต่อหลังจากลงทะเบียนเสร็จ
            if (registrationCallback) {
                registrationCallback();
            }
        })
        .catch(err => {
            console.error('Registration error:', err);
            // กรณีระบบเครือข่ายมีปัญหา ให้สิทธิ์ผู้ใช้คัดลอกไปก่อนเพื่อไม่ให้ขัดขวางการทำงาน (แต่บันทึกสถานะลงทะเบียนไว้ชั่วคราว)
            sessionStorage.setItem('prompt_user_registered', 'true');
            hideRegistrationModal();
            if (registrationCallback) {
                registrationCallback();
            }
        })
        .finally(() => {
            btnSubmitRegister.disabled = false;
            btnSubmitRegister.textContent = 'ลงทะเบียนและคัดลอก';
        });
    });

    // ฟังก์ชันคัดลอก Prompt
    function copyPromptToClipboard() {
        const textToCopy = promptPreview.textContent;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                toastMessage.classList.remove('hidden');
                setTimeout(() => {
                    toastMessage.classList.add('hidden');
                }, 4000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                alert('เกิดข้อผิดพลาดในการคัดลอกข้อความ กรุณาคลุมดำและคัดลอกด้วยตนเอง');
            });
    }

    // เมื่อกดปุ่ม Copy Prompt
    btnCopyPrompt.addEventListener('click', () => {
        if (!isUserRegistered()) {
            showRegistrationModal(() => {
                copyPromptToClipboard();
            });
        } else {
            copyPromptToClipboard();
        }
    });

    // เมื่อลากคลุมดำแล้วกดคัดลอก (Ctrl+C หรือคลิกขวาคัดลอก) ในช่องพรีวิว
    promptPreview.addEventListener('copy', (e) => {
        if (!isUserRegistered()) {
            e.preventDefault(); // บล็อกการคัดลอกไว้ก่อน
            showRegistrationModal(() => {
                // คัดลอกข้อความลงคลิปบอร์ดให้ทันทีหลังลงทะเบียนเสร็จ
                copyPromptToClipboard();
            });
        }
    });
});
