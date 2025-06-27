import nodemailer from "nodemailer";

// メール送信設定
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 投稿確認メールのテンプレート
export function generatePostConfirmationEmail(
  userEmail: string,
  postData: {
    keywords: string[];
    info: string;
    imageUrl: string;
    caption: string;
    targetTime: string;
    postId: number;
  }
) {
  const { keywords, info, imageUrl, caption, targetTime, postId } = postData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Instagram投稿確認</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .post-image { max-width: 100%; height: auto; border-radius: 8px; margin: 15px 0; }
        .keyword-tag { display: inline-block; background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; margin: 2px; font-size: 12px; }
        .caption { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button.approve { background: #28a745; }
        .button.reject { background: #dc3545; }
        .info-section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 Instagram投稿確認</h1>
          <p>新しい投稿が生成されました。内容を確認して承認または拒否してください。</p>
        </div>

        <div class="content">
          <h2>投稿詳細</h2>

          <div class="info-section">
            <h3>🎯 キーワード</h3>
            <div>
              ${keywords.map((keyword) => `<span class="keyword-tag">${keyword}</span>`).join("")}
            </div>
          </div>

          <div class="info-section">
            <h3>📝 生成された情報</h3>
            <p>${info}</p>
          </div>

          <div class="info-section">
            <h3>🖼️ 投稿画像</h3>
            <img src="${imageUrl}" alt="投稿画像" class="post-image">
          </div>

          <div class="info-section">
            <h3>📄 キャプション</h3>
            <div class="caption">
              ${caption.replace(/\n/g, "<br>")}
            </div>
          </div>

          <div class="info-section">
            <h3>⏰ 投稿予定時刻</h3>
            <p>${new Date(targetTime).toLocaleString("ja-JP")}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/posts/confirm/${postId}?action=approve" class="button approve">
              ✅ 承認して投稿
            </a>
            <a href="${process.env.NEXTAUTH_URL}/posts/confirm/${postId}?action=reject" class="button reject">
              ❌ 拒否
            </a>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL}/posts" class="button">
              📊 ダッシュボードで確認
            </a>
          </div>
        </div>

        <div class="footer">
          <p>このメールはInstagram AI Autopilotから自動送信されました。</p>
          <p>© 2024 Instagram AI Autopilot. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Instagram投稿確認

新しい投稿が生成されました。内容を確認して承認または拒否してください。

投稿詳細:
- キーワード: ${keywords.join(", ")}
- 生成された情報: ${info}
- 投稿予定時刻: ${new Date(targetTime).toLocaleString("ja-JP")}

キャプション:
${caption}

承認: ${process.env.NEXTAUTH_URL}/posts/confirm/${postId}?action=approve
拒否: ${process.env.NEXTAUTH_URL}/posts/confirm/${postId}?action=reject
ダッシュボード: ${process.env.NEXTAUTH_URL}/posts

このメールはInstagram AI Autopilotから自動送信されました。
  `;

  return {
    subject: "📸 Instagram投稿確認 - 新しい投稿が生成されました",
    html: htmlContent,
    text: textContent,
  };
}

// メール送信関数
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("メール送信成功:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("メール送信エラー:", error);
    return { success: false, error };
  }
}

// 投稿確認メール送信
export async function sendPostConfirmationEmail(
  userEmail: string,
  postData: {
    keywords: string[];
    info: string;
    imageUrl: string;
    caption: string;
    targetTime: string;
    postId: number;
  }
) {
  const emailContent = generatePostConfirmationEmail(userEmail, postData);
  return await sendEmail(userEmail, emailContent.subject, emailContent.html, emailContent.text);
}
