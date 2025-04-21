document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transactionForm');
    const accountInput = document.getElementById('account_id');
    const submitBtn = form.querySelector('.submit-btn');
    const resultContainer = document.getElementById('result');
    const resultText = resultContainer.querySelector('.result-text');
    const successIcon = document.querySelector('.success-icon');
    const errorIcon = document.querySelector('.error-icon');
    const cardHeader = document.querySelector('.card-header i');

    // Add subtle animation to header icon
    setInterval(() => {
        cardHeader.style.transform = 'scale(1.1)';
        setTimeout(() => {
            cardHeader.style.transform = 'scale(1)';
        }, 500);
    }, 3000);
    
    // Particle effect for the background
    const addParticleEffect = () => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 10 + 5;
        const xPos = Math.random() * window.innerWidth;
        const yPos = Math.random() * window.innerHeight;
        const duration = Math.random() * 5 + 3;
        const colors = [
            'rgba(139, 92, 246, 0.5)',
            'rgba(236, 72, 153, 0.5)',
            'rgba(245, 158, 11, 0.5)',
            'rgba(59, 130, 246, 0.5)'
        ];
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${xPos}px`;
        particle.style.top = `${yPos}px`;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animation = `float ${duration}s linear infinite`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    };
    
    // Create occasional floating particles
    setInterval(addParticleEffect, 300);
    
    // Add floating animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translateY(0) rotate(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.5; }
            100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .particle {
            position: fixed;
            border-radius: 50%;
            z-index: -1;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // Input animations
    accountInput.addEventListener('focus', () => {
        accountInput.parentElement.style.transform = 'translateY(-5px)';
    });
    
    accountInput.addEventListener('blur', () => {
        if (!accountInput.value) {
            accountInput.parentElement.style.transform = 'translateY(0)';
        }
    });

    // Validation function
    const validateAccountId = (value) => {
        const accountError = document.getElementById('account-error');
        if (!value) {
            accountError.textContent = 'Account ID is required';
            accountError.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => { accountError.style.animation = ''; }, 500);
            return false;
        }
        if (!/^\d{5,10}$/.test(value)) {
            accountError.textContent = 'Account ID must be 5-10 digits';
            accountError.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => { accountError.style.animation = ''; }, 500);
            return false;
        }
        accountError.textContent = '';
        return true;
    };

    // Real-time validation
    accountInput.addEventListener('input', () => {
        validateAccountId(accountInput.value);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate account ID
        const isAccountValid = validateAccountId(accountInput.value);

        if (!isAccountValid) {
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        resultContainer.style.display = 'none';
        
        // Add typing animation to button
        submitBtn.innerHTML = '<span class="btn-text">Analyzing account</span><span class="dots">...</span><div class="loader"></div>';
        const dots = submitBtn.querySelector('.dots');
        let dotCount = 0;
        const typingAnimation = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            dots.textContent = '.'.repeat(dotCount || 3);
        }, 300);

        try {
            const response = await fetch('/check_transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: accountInput.value
                })
            });

            const data = await response.json();

            // Clear typing animation
            clearInterval(typingAnimation);

            // Hide loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Check Account</span><div class="loader"></div>';

            // Artificial delay for dramatic effect
            setTimeout(() => {
            // Show result with animation
            resultContainer.style.display = 'block';
            resultContainer.classList.add('show');

                // Get risk score or default to 0
                const riskScore = data.risk_score !== undefined ? data.risk_score : 0;
                
                // Create risk score visualization
                const riskScoreHtml = `
                    <div class="risk-score-container">
                        <div class="risk-score-label">Safety Score:</div>
                        <div class="risk-score-bar">
                            <div class="risk-score-fill" style="width: ${riskScore}%;
                                background: ${riskScore >= 70 ? 'var(--success-color)' : 
                                            riskScore >= 50 ? 'var(--accent-color-1)' : 
                                            'var(--error-color)'}">
                            </div>
                        </div>
                        <div class="risk-score-value">${riskScore}/100</div>
                    </div>
                `;

                // Update result message and icon based on fraudulent/legitimate status
            if (data.result === 'Legitimate') {
                successIcon.style.display = 'block';
                errorIcon.style.display = 'none';
                    resultText.innerHTML = `
                        <div class="result-badge success">SAFE</div>
                        <div>Account appears to be legitimate</div>
                        <div class="confidence-meter ${data.confidence || 'medium'}">
                            Confidence: <span>${data.confidence || 'Medium'}</span>
                        </div>
                        ${riskScoreHtml}
                        <div class="transaction-id">ID: ${data.transaction_id || accountInput.value}</div>
                    `;
                resultText.style.color = 'var(--success-color)';
                    
                    // Confetti effect for successful transaction
                    createConfetti();
            } else {
                successIcon.style.display = 'none';
                errorIcon.style.display = 'block';
                    
                // Generate risk factor explanations if available
                let riskFactorsHtml = '';
                
                resultText.innerHTML = `
                    <div class="result-badge danger">ALERT</div>
                    <div class="fraud-warning">Potential fraudulent account detected</div>
                    <div class="confidence-meter ${data.confidence || 'medium'}">
                        Confidence: <span>${data.confidence || 'Medium'}</span>
                    </div>
                    ${riskScoreHtml}
                    <div class="transaction-id">ID: ${data.transaction_id || accountInput.value}</div>
                `;
                resultText.style.color = 'var(--error-color)';
                
                // Warning shake effect
                resultContainer.classList.add('warning-shake');
                setTimeout(() => {
                    resultContainer.classList.remove('warning-shake');
                }, 1000);
            }
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            clearInterval(typingAnimation);
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Check Account</span><div class="loader"></div>';
            
            resultContainer.style.display = 'block';
            resultContainer.classList.add('show');
            successIcon.style.display = 'none';
            errorIcon.style.display = 'block';
            resultText.innerHTML = `
                <div class="result-badge danger">ERROR</div>
                <div>An error occurred. Please try again.</div>
            `;
            resultText.style.color = 'var(--error-color)';
        }
    });
    
    // Confetti effect function
    function createConfetti() {
        const confettiCount = 100;
        const container = document.createElement('div');
        container.className = 'confetti-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        
        const colors = ['#6366F1', '#EC4899', '#F59E0B', '#3B82F6', '#10B981'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const size = Math.random() * 10 + 5;
            confetti.style.position = 'absolute';
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.opacity = Math.random();
            confetti.style.top = '-20px';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animation = `confetti ${Math.random() * 3 + 2}s linear forwards`;
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
                
                // Remove container when all confetti are gone
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 5000);
        }
        
        // Add confetti animation
        const confettiStyle = document.createElement('style');
        confettiStyle.textContent = `
            @keyframes confetti {
                0% { transform: translateY(0) rotate(0); }
                100% { transform: translateY(100vh) rotate(720deg); }
            }
            
            @keyframes warning-shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
            
            .warning-shake {
                animation: warning-shake 0.5s ease-in-out;
            }
            
            .result-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .result-badge.success {
                background-color: var(--success-color);
                color: white;
            }
            
            .result-badge.danger {
                background-color: var(--error-color);
                color: white;
            }
            
            .transaction-id {
                font-size: 0.8rem;
                opacity: 0.8;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(confettiStyle);
    }

    // Interactive elements in about section
    document.querySelectorAll('.about-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('i');
            icon.style.transform = 'rotateY(180deg)';
        });
        
        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('i');
            icon.style.transform = 'rotateY(0)';
        });
    });
});
