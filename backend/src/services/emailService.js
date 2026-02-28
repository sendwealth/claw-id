const crypto = require('crypto');

class EmailService {
  constructor() {
    this.domain = process.env.EMAIL_DOMAIN || 'claw.id';
  }

  /**
   * 生成智能体 ID
   */
  generateAgentId() {
    return `agent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * 生成智能体邮箱
   */
  generateEmail(agentId) {
    const shortId = agentId.replace('agent_', '').substring(0, 8);
    return `agent-${shortId}@${this.domain}`;
  }

  /**
   * 生成验证码
   */
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * 发送验证邮件（模拟）
   * 生产环境需要集成 SendGrid 或其他邮件服务
   */
  async sendVerificationEmail(email, code) {
    console.log(`[Email] 发送验证邮件到 ${email}, 验证码: ${code}`);

    // TODO: 集成真实邮件服务
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject: 'CLAW ID 验证码',
    //   text: `您的验证码是: ${code}`
    // });

    return {
      success: true,
      message: 'Verification email sent (simulated)',
      email,
      code
    };
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(email, code) {
    // TODO: 实现真实的验证逻辑
    console.log(`[Email] 验证邮箱 ${email}, 验证码: ${code}`);
    return { success: true, verified: true };
  }
}

module.exports = new EmailService();
