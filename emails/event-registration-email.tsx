import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components"

interface EventRegistrationEmailProps {
  formName: string
  formCode: string
  userName?: string
  qrCodeUrl?: string
  registrationDate?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  customFields?: Record<string, string>
}

export default function EventRegistrationEmail({
  formName,
  formCode,
  userName = "there",
  qrCodeUrl,
  registrationDate = new Date().toLocaleDateString(),
  eventDate,
  eventTime,
  eventLocation,
  customFields = {},
}: EventRegistrationEmailProps) {
  const previewText = `Registration Confirmation: ${formName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Img src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`} alt="Logo" width="64" height="64" />
          </Section>
          <Heading style={heading}>Registration Confirmed!</Heading>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            Your registration for <strong>{formName}</strong> has been confirmed. Thank you for registering!
          </Text>

          {qrCodeUrl && (
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Text style={{ ...paragraph, fontWeight: "bold", marginBottom: "16px" }}>Your QR Code for Check-in</Text>
              <Img
                src={qrCodeUrl}
                alt="QR Code"
                width="200"
                height="200"
                style={{ margin: "0 auto", display: "block" }}
              />
              <Text style={{ ...paragraph, fontSize: "14px", marginTop: "8px" }}>Registration Code: {formCode}</Text>
            </Section>
          )}

          <Section style={eventDetails}>
            <Text style={{ ...paragraph, fontWeight: "bold", marginBottom: "8px" }}>Event Details:</Text>
            <Text style={eventInfo}>Registration Date: {registrationDate}</Text>
            {eventDate && <Text style={eventInfo}>Event Date: {eventDate}</Text>}
            {eventTime && <Text style={eventInfo}>Event Time: {eventTime}</Text>}
            {eventLocation && <Text style={eventInfo}>Location: {eventLocation}</Text>}

            {Object.keys(customFields).length > 0 && (
              <>
                <Text style={{ ...paragraph, fontWeight: "bold", marginTop: "16px", marginBottom: "8px" }}>
                  Your Information:
                </Text>
                {Object.entries(customFields).map(([key, value]) => (
                  <Text key={key} style={eventInfo}>
                    {key}: {value}
                  </Text>
                ))}
              </>
            )}
          </Section>

          <Section style={footerSection}>
            <Text style={footer}>If you have any questions, please contact the event organizer.</Text>
            <Text style={footer}>© {new Date().getFullYear()} Orionis. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "32px",
  backgroundColor: "#ffffff",
  maxWidth: "600px",
}

const logo = {
  marginBottom: "24px",
  textAlign: "center" as const,
}

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "16px 0",
  color: "#333",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#333",
  margin: "16px 0",
}

const eventDetails = {
  backgroundColor: "#f9f9f9",
  padding: "16px",
  borderRadius: "4px",
  margin: "24px 0",
}

const eventInfo = {
  fontSize: "15px",
  lineHeight: "22px",
  margin: "4px 0",
  color: "#555",
}

const footerSection = {
  marginTop: "32px",
  borderTop: "1px solid #eee",
  paddingTop: "16px",
}

const footer = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#777",
  textAlign: "center" as const,
  margin: "4px 0",
}
