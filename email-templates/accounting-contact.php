<?php
/**
 * Accounting Health Check Form Processor
 */

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Sanitize and collect form data
$name                = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$email               = isset($_POST['email']) ? trim(strip_tags($_POST['email'])) : '';
$phone               = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
$business_type       = isset($_POST['business_type']) ? trim(strip_tags($_POST['business_type'])) : '';
$business_size       = isset($_POST['business_size']) ? trim(strip_tags($_POST['business_size'])) : '';
$monthly_revenue     = isset($_POST['monthly_revenue']) ? trim(strip_tags($_POST['monthly_revenue'])) : '';
$checklist_score     = isset($_POST['checklist_score']) ? trim(strip_tags($_POST['checklist_score'])) : '0';
$recommended_package = isset($_POST['recommended_package']) ? trim(strip_tags($_POST['recommended_package'])) : '';
$selected_package    = isset($_POST['selected_package']) ? trim(strip_tags($_POST['selected_package'])) : '';
$checklist_answers   = isset($_POST['checklist_answers']) ? trim(strip_tags($_POST['checklist_answers'])) : '';
$checklist_result    = isset($_POST['checklist_result_display']) ? trim(strip_tags($_POST['checklist_result_display'])) : '';

// Validate required fields
if (empty($name) || empty($email) || empty($phone)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields (Name, Email, Phone).']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

if (empty($selected_package)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Please select a package.']);
    exit;
}

//
// ✅ ADD THIS BLOCK (ID → readable mapping)
//
$checklist_map = [
    'fin1' => 'My income and expenses are recorded monthly',
    'fin2' => 'I have up-to-date management accounts',
    'fin3' => 'I have annual financial statements',
    'fin4' => 'My records are updated within the last 30 days',

    'tax1' => 'All tax returns are submitted on time',
    'tax2' => 'EMP201 / PAYE is filed monthly',
    'tax3' => 'My company is correctly registered (CIPC, VAT if applicable)',
    'tax4' => 'I understand my tax obligations',

    'ctrl1' => 'Duties are properly segregated',
    'ctrl2' => 'Suppliers are vetted before approval',
    'ctrl3' => 'We have documented internal processes',
    'ctrl4' => 'A risk register is maintained',

    'asset1' => 'We maintain a fixed asset register',
    'asset2' => 'Payroll is reviewed and reconciled',
    'asset3' => 'Staff performance is tracked',
    'asset4' => 'There is a structured incentive or bonus system'
];

$answers_array = array_map('trim', explode(',', $checklist_answers));
$readable_answers = [];

foreach ($answers_array as $id) {
    if (isset($checklist_map[$id])) {
        $readable_answers[] = '• ' . $checklist_map[$id];
    }
}

$answers_output = !empty($readable_answers)
    ? implode('<br>', $readable_answers)
    : 'None selected';

$answers_text = !empty($readable_answers)
    ? implode("\n", $readable_answers)
    : 'None selected';

// Email configuration
$to = 'accounting@kzdsolutions.co.za';
$subject = 'Business Health Check Submission from ' . $name;

// Build HTML email body
$message = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"> <!-- ✅ FIX encoding -->
    <title>Business Health Check Results</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h2 { color: #252840; border-bottom: 2px solid #252840; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { background: #f0f0f0; padding: 8px 12px; font-weight: bold; color: #252840; margin-bottom: 10px; border-left: 3px solid #252840; }
        .field { margin-bottom: 8px; }
        .field-label { font-weight: bold; display: inline-block; width: 180px; }
        .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
        .highlight { background: #e8f0fe; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>New Business Health Check Submission</h2>
        
        <div class="section">
            <div class="section-title">Contact Information</div>
            <div class="field"><span class="field-label">Full Name:</span> ' . htmlspecialchars($name) . '</div>
            <div class="field"><span class="field-label">Email Address:</span> ' . htmlspecialchars($email) . '</div>
            <div class="field"><span class="field-label">Phone Number:</span> ' . htmlspecialchars($phone) . '</div>
        </div>
        
        <div class="section">
            <div class="section-title">Business Details</div>
            <div class="field"><span class="field-label">Business Type:</span> ' . htmlspecialchars($business_type) . '</div>
            <div class="field"><span class="field-label">Business Size:</span> ' . htmlspecialchars($business_size) . '</div>
            <div class="field"><span class="field-label">Monthly Revenue:</span> ' . htmlspecialchars($monthly_revenue) . '</div>
        </div>
        
        <div class="section">
            <div class="section-title">Package Selection</div>
            <div class="highlight">
                <div class="field"><span class="field-label">Selected Package:</span> <strong>' . htmlspecialchars($selected_package) . '</strong></div>
                <div class="field"><span class="field-label">Auto-Recommended:</span> ' . htmlspecialchars($recommended_package) . '</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">✅ Health Check Results</div>
            <div class="field"><span class="field-label">Checklist Score:</span> <strong>' . htmlspecialchars($checklist_score) . ' / 16</strong></div>
            <div class="field"><span class="field-label">Score Range:</span> ' . htmlspecialchars($checklist_result) . '</div>
            <div class="field"><span class="field-label">Checklist Answers:</span><br>' . $answers_output . '</div>
        </div>
        
        <div class="footer">
            <p>This form was submitted from the Accounting page on ' . date('Y-m-d H:i:s') . '.</p>
            <p><strong>KZD Solutions</strong> - Accounting Health Check System</p>
        </div>
    </div>
</body>
</html>';

// Plain text version
$altBody = "New Business Health Check Submission\n\n";
$altBody .= "Name: $name\nEmail: $email\nPhone: $phone\n\n";
$altBody .= "Business Type: $business_type\n";
$altBody .= "Business Size: $business_size\n";
$altBody .= "Monthly Revenue: $monthly_revenue\n\n";
$altBody .= "Selected Package: $selected_package\n";
$altBody .= "Recommended: $recommended_package\n\n";
$altBody .= "Score: $checklist_score / 16\n";
$altBody .= "Range: $checklist_result\n\n";
$altBody .= "Checklist:\n$answers_text\n";

// PHPMailer
require_once 'phpmailer/Exception.php';
require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

$mail = new PHPMailer(true);

try {
    $mail->CharSet = 'UTF-8'; // ✅ FIX encoding

    $mail->isSMTP();
    $mail->Host       = 'mail.kzdsolutions.co.za';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'accounting@kzdsolutions.co.za';
    $mail->Password   = 'NondyPro@2026';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom('accounting@kzdsolutions.co.za', 'KZD Accounting');
    $mail->addAddress($to);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $message;
    $mail->AltBody = $altBody;

    $mail->send();

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Your health check has been sent successfully!']);

} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
?>