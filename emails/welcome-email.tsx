import { Html, Body, Container, Text, Link, Hr, Head } from "@react-email/components"

interface WelcomeEmailProps {
  username: string
  loginUrl: string
}

export default function WelcomeEmail({ username, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>Event Form Builder</Text>
          <Text style={titleStyle}>Welcome to Event Form Builder!</Text>
          <Text style={paragraphStyle}>Hi {username},</Text>
          <Text style={paragraphStyle}>
            Thank you for verifying your email address. Your account is now fully activated, and you can start creating
            event registration forms right away.
          </Text>
          <Text style={paragraphStyle}>With Event Form Builder, you can:</Text>
          <ul style={listStyle}>
            <li style={listItemStyle}>Create custom event registration forms</li>
            <li style={listItemStyle}>Share forms with a simple 4-digit code</li>
            <li style={listItemStyle}>Track registrations and check-ins</li>
            <li style={listItemStyle}>Generate QR codes for easy sharing</li>
            <li style={listItemStyle}>Export responses to CSV</li>
          </ul>
          <Link href={loginUrl} style={buttonStyle}>
            Log In to Your Account
          </Link>
          <Text style={paragraphStyle}>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </Text>
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

const listStyle = {
  marginBottom: "20px",
}

const listItemStyle = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  marginBottom: "8px",
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

