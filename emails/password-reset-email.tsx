import { Html, Body, Container, Text, Link, Hr, Head } from "@react-email/components"

interface PasswordResetEmailProps {
  username: string
  resetUrl: string
}

export default function PasswordResetEmail({ username, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>Event Form Builder</Text>
          <Text style={titleStyle}>Reset Your Password</Text>
          <Text style={paragraphStyle}>Hi {username},</Text>
          <Text style={paragraphStyle}>
            We received a request to reset your password for your Event Form Builder account. To reset your password,
            please click the button below:
          </Text>
          <Link href={resetUrl} style={buttonStyle}>
            Reset Password
          </Link>
          <Text style={paragraphStyle}>
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </Text>
          <Text style={paragraphStyle}>
            Alternatively, you can copy and paste the following link into your browser:
          </Text>
          <Text style={linkTextStyle}>{resetUrl}</Text>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>&copy; {new Date().getFullYear()} Event Form Builder. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const containerStyle = {
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "5px",
  maxWidth: "600px",
}

const headerStyle = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  color: "#333",
  margin: "10px 0 30px",
}

const titleStyle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#333",
  marginBottom: "20px",
}

const paragraphStyle = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  marginBottom: "16px",
}

const buttonStyle = {
  display: "block",
  backgroundColor: "#7c3aed",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "4px",
  textDecoration: "none",
  textAlign: "center" as const,
  fontSize: "16px",
  fontWeight: "bold" as const,
  margin: "24px auto",
  width: "250px",
}

const linkTextStyle = {
  fontSize: "14px",
  color: "#7c3aed",
  wordBreak: "break-all" as const,
  marginBottom: "24px",
}

const hrStyle = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footerStyle = {
  fontSize: "14px",
  color: "#999",
  textAlign: "center" as const,
  marginTop: "20px",
}

