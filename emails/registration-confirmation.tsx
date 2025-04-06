import { Html, Body, Container, Text, Link, Hr, Head, Section } from "@react-email/components"

interface RegistrationConfirmationEmailProps {
  eventName: string
  attendeeName: string
  eventDate?: string
  eventLocation?: string
  eventCode: string
  registrationDetails: Array<{ label: string; value: string }>
  viewUrl: string
}

export default function RegistrationConfirmationEmail({
  eventName,
  attendeeName,
  eventDate,
  eventLocation,
  eventCode,
  registrationDetails,
  viewUrl,
}: RegistrationConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>Event Registration Confirmation</Text>
          <Section style={sectionStyle}>
            <Text style={titleStyle}>Thank you for registering, {attendeeName}!</Text>
            <Text style={paragraphStyle}>
              Your registration for <strong>{eventName}</strong> has been confirmed.
            </Text>

            {eventDate && (
              <Text style={paragraphStyle}>
                <strong>Date:</strong> {eventDate}
              </Text>
            )}

            {eventLocation && (
              <Text style={paragraphStyle}>
                <strong>Location:</strong> {eventLocation}
              </Text>
            )}

            <Text style={paragraphStyle}>
              <strong>Event Code:</strong> {eventCode}
            </Text>

            <Hr style={hrStyle} />

            <Text style={subtitleStyle}>Registration Details:</Text>

            {registrationDetails.map((detail, index) => (
              <Text key={index} style={detailStyle}>
                <strong>{detail.label}:</strong> {detail.value}
              </Text>
            ))}

            <Hr style={hrStyle} />

            <Text style={paragraphStyle}>You can view the event details at any time by clicking the button below:</Text>

            <Link href={viewUrl} style={buttonStyle}>
              View Event Details
            </Link>

            <Text style={paragraphStyle}>If you have any questions, please contact the event organizer.</Text>
          </Section>
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

const sectionStyle = {
  padding: "20px",
  borderRadius: "5px",
  backgroundColor: "#f9f9f9",
}

const titleStyle = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#333",
  marginBottom: "20px",
}

const subtitleStyle = {
  fontSize: "18px",
  fontWeight: "bold" as const,
  color: "#333",
  marginBottom: "10px",
}

const paragraphStyle = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  marginBottom: "16px",
}

const detailStyle = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  marginBottom: "8px",
}

const buttonStyle = {
  display: "block",
  backgroundColor: "#1A2A4A",
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

