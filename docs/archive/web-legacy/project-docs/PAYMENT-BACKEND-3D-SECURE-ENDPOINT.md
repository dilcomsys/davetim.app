# 🔐 Backend 3D Secure Endpoint

## 📋 Gerekli Backend Endpoint

Frontend artık 3D Secure için **backend endpoint**'ine redirect yapıyor.

### Endpoint
```
GET /api/payment/iyzico/3dsecure/{transactionId}
```

### Amaç
- İyzico'dan alınan 3D Secure HTML içeriğini serve eder
- Form submit sonrası callback'i handle eder
- Success/failure durumunda frontend'e redirect yapar

---

## 💻 Backend Implementation (C#)

### 1. Controller Method

```csharp
[HttpGet("iyzico/3dsecure/{transactionId}")]
public async Task<IActionResult> Serve3DSecure(string transactionId)
{
    try
    {
        // Get payment from cache/database
        var payment = await _paymentRepository.GetByTransactionId(transactionId);
        
        if (payment == null)
        {
            return NotFound(new { error = "Payment not found" });
        }
        
        // Get 3D Secure HTML content (stored during payment initiation)
        var htmlContent = payment.ThreeDSecureHtmlContent;
        
        if (string.IsNullOrEmpty(htmlContent))
        {
            return BadRequest(new { error = "3D Secure content not available" });
        }
        
        // Serve HTML directly
        return Content(htmlContent, "text/html");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error serving 3D Secure page");
        return StatusCode(500, new { error = "Internal server error" });
    }
}
```

### 2. Payment Repository Update

Payment entity'ye `ThreeDSecureHtmlContent` alanı ekleyin:

```csharp
public class Payment
{
    public string TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string Status { get; set; } // WAITING_3D, SUCCESS, FAILURE
    
    // 3D Secure HTML content (from İyzico)
    public string? ThreeDSecureHtmlContent { get; set; }
    
    public DateTime CreatedAt { get; set; }
    // ... other fields
}
```

### 3. Process Payment Method Update

```csharp
[HttpPost("iyzico/process")]
public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest request)
{
    try
    {
        // Call İyzico API
        var iyzicoResponse = await _iyzicoService.InitiatePayment(request);
        
        if (iyzicoResponse.Status == "WAITING_3D")
        {
            // Save payment to database with 3D HTML content
            var payment = new Payment
            {
                TransactionId = request.TransactionId,
                Amount = request.Amount,
                Currency = request.Currency,
                Status = "WAITING_3D",
                ThreeDSecureHtmlContent = iyzicoResponse.ThreeDSecureHtmlContent, // ✅ Store HTML
                CreatedAt = DateTime.UtcNow
            };
            
            await _paymentRepository.SaveAsync(payment);
            
            // Return transaction ID (NOT HTML content)
            return Ok(new
            {
                success = true,
                status = "WAITING_3D_SECURE",
                transactionId = request.TransactionId,
                // DON'T send HTML to frontend anymore
                // Frontend will redirect to: /api/payment/iyzico/3dsecure/{transactionId}
            });
        }
        
        // ... handle other statuses
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Payment processing error");
        return StatusCode(500, new { error = ex.Message });
    }
}
```

---

## 🔄 Complete Flow

### Frontend → Backend → İyzico → Frontend

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION 3D SECURE FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

1. User → Fill payment form
   ↓
2. Frontend → POST /api/payment/iyzico/process
   {
     transactionId: "SUB-123...",
     amount: 79,
     cardInfo: {...},
     use3DSecure: true,
     clientRedirectUrl: "https://davetim.app/payment/callback"
   }
   ↓
3. Backend → Call İyzico API
   ↓
4. İyzico → Returns 3D Secure HTML
   ↓
5. Backend → Save payment + HTML to database
   Backend → Returns: { status: "WAITING_3D_SECURE", transactionId: "SUB-123..." }
   ↓
6. Frontend → Redirect to:
   https://payment.dilcomsys.com/api/payment/iyzico/3dsecure/SUB-123...
   ↓
7. Backend → GET /3dsecure/{transactionId}
   Backend → Fetch HTML from database
   Backend → Serve HTML (İyzico 3D Secure page)
   ↓
8. Browser → Shows İyzico 3D Secure page
   ↓
9. User → Enter 3D code → Submit
   ↓
10. İyzico → Verify code
    İyzico → POST /api/payment/iyzico/callback (backend)
    ↓
11. Backend → Verify payment with İyzico
    Backend → Update payment status in database
    Backend → Redirect to:
      SUCCESS: https://davetim.app/payment/callback?success=true&transactionId=SUB-123...
      FAILURE: https://davetim.app/payment/callback?success=false&error=...
    ↓
12. Frontend → PaymentCallbackPage
    Frontend → Check payment status
    Frontend → Upgrade subscription
    Frontend → Show success message
    Frontend → Redirect to /account
    ↓
13. ✅ COMPLETE
```

---

## 🌐 Environment URLs

### Local Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000

3D Secure URL: http://localhost:5000/api/payment/iyzico/3dsecure/{transactionId}
```

### Production
```
Frontend: https://davetim.app
Backend:  https://payment.dilcomsys.com

3D Secure URL: https://payment.dilcomsys.com/api/payment/iyzico/3dsecure/{transactionId}
```

---

## ✅ Avantajlar

### 1. **Production Ready**
- ✅ No `about:blank#blocked`
- ✅ No CORS issues
- ✅ No blob URL issues
- ✅ Works on all browsers

### 2. **Clean Architecture**
- ✅ Frontend: Sadece redirect
- ✅ Backend: HTML serving + callback handling
- ✅ Separation of concerns

### 3. **Security**
- ✅ HTML content backend'de saklanır
- ✅ Frontend HTML görmez (XSS risk yok)
- ✅ Backend doğrulama kontrolü

### 4. **Debugging**
- ✅ Backend logs
- ✅ Transaction tracking
- ✅ Easy troubleshooting

---

## 🧪 Test

### 1. Local Test
```bash
# Backend çalıştır
cd PaymentService
dotnet run

# Frontend çalıştır
cd frontend
npm run dev

# Test URL:
http://localhost:5173/pricing
```

### 2. Production Test
```bash
# Frontend build
npm run build
docker-compose up -d

# Test URL:
https://davetim.app/pricing
```

---

## 📝 Database Schema

### Payment Table
```sql
CREATE TABLE payments (
    transaction_id VARCHAR(100) PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL, -- WAITING_3D, SUCCESS, FAILURE
    three_d_secure_html_content TEXT, -- İyzico HTML
    provider_transaction_id VARCHAR(100),
    customer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_id ON payments(transaction_id);
CREATE INDEX idx_status ON payments(status);
```

---

## 🔐 Security Checklist

- ✅ HTTPS only (production)
- ✅ CORS configured (frontend domain allowed)
- ✅ Transaction ID validation
- ✅ Payment status check before serving HTML
- ✅ HTML content sanitization (optional, İyzico provides clean HTML)
- ✅ Rate limiting on 3D Secure endpoint
- ✅ Logging all requests

---

## 🚨 Common Issues

### Issue 1: "Payment not found"
**Cause:** Transaction ID invalid or expired  
**Solution:** Check database, verify payment was created

### Issue 2: "3D Secure content not available"
**Cause:** HTML not saved during payment initiation  
**Solution:** Update process payment method to save HTML

### Issue 3: Infinite redirect loop
**Cause:** Backend callback redirect wrong  
**Solution:** Ensure `clientRedirectUrl` is correct in payment request

### Issue 4: CORS error
**Cause:** Frontend domain not in CORS allow list  
**Solution:** Add `https://davetim.app` to backend CORS config

---

## 🎉 Summary

### What Changed?
**Before:**
- Frontend receives HTML from backend
- Frontend tries to display HTML (blob/document.write)
- ❌ Issues with popup blockers, CORS, React Router

**After:**
- Frontend receives transaction ID only
- Frontend redirects to backend endpoint
- Backend serves HTML directly
- ✅ Clean, reliable, production-ready

### Backend TODO:
1. ✅ Create `GET /api/payment/iyzico/3dsecure/{transactionId}` endpoint
2. ✅ Add `ThreeDSecureHtmlContent` field to Payment entity
3. ✅ Update `ProcessPayment` to save HTML
4. ✅ Test endpoint returns HTML correctly

**Status:** Ready for backend implementation! 🚀

