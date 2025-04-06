import { Html, Body, Container, Text, Link, Hr, Head } from "@react-email/components"

interface MassEmailTemplateProps {
  subject: string
  eventName: string
  recipientName: string
  content: string
  unsubscribeUrl: string
  eventCode: string
}

export default function MassEmailTemplate({
  subject,
  eventName,
  recipientName,
  content,
  unsubscribeUrl,
  eventCode,
}: MassEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>Event Form Builder</Text>
          <Text style={titleStyle}>{subject}</Text>
          <Text style={paragraphStyle}>Hi {recipientName},</Text>
          <Text style={paragraphStyle}>
            You are receiving this email because you registered for <strong>{eventName}</strong> (Event Code:{" "}
            {eventCode}).
          </Text>

          <div dangerouslySetInnerHTML={{ __html: content }} style={contentStyle} />

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            &copy; {new Date().getFullYear()} Event Form Builder. All rights reserved.
            <br />
            <Link href={unsubscribeUrl} style={unsubscribeStyle}>
              Unsubscribe from these emails
            </Link>
          </Text>
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

const contentStyle = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  margin: "20px 0",
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

const unsubscribeStyle = {
  color: "#999",
  textDecoration: "underline",
  fontSize: "12px",
}

