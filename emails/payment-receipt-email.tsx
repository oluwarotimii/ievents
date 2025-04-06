import { Html, Body, Container, Text, Link, Hr, Head, Section } from "@react-email/components"

interface PaymentReceiptEmailProps {
  eventName: string
  attendeeName: string
  reference: string
  amount: number
  fee: number
  totalAmount: number
  currency: string
  paymentDate: string
  viewUrl: string
}

export default function PaymentReceiptEmail({
  eventName,
  attendeeName,
  reference,
  amount,
  fee,
  totalAmount,
  currency,
  paymentDate,
  viewUrl,
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>Payment Receipt</Text>
          <Section style={sectionStyle}>
            <Text style={titleStyle}>Payment Successful!</Text>
            <Text style={paragraphStyle}>Dear {attendeeName},</Text>
            <Text style={paragraphStyle}>
              Thank you for your payment for <strong>{eventName}</strong>. Your transaction has been completed
              successfully.
            </Text>

            <Hr style={hrStyle} />

            <Text style={subtitleStyle}>Payment Details:</Text>

            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={tableLabelStyle}>Reference:</td>
                  <td style={tableValueStyle}>{reference}</td>
                </tr>
                <tr>
                  <td style={tableLabelStyle}>Base Amount:</td>
                  <td style={tableValueStyle}>
                    {currency} {amount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabelStyle}>Platform Fee:</td>
                  <td style={tableValueStyle}>
                    {currency} {fee.toLocaleString()}
                  </td>
                </tr>
                <tr style={totalRowStyle}>
                  <td style={tableLabelStyle}>Total Amount:</td>
                  <td style={tableValueStyle}>
                    {currency} {totalAmount.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabelStyle}>Date:</td>
                  <td style={tableValueStyle}>{paymentDate}</td>
                </tr>
                <tr>
                  <td style={tableLabelStyle}>Status:</td>
                  <td style={tableValueStyle}>Completed</td>
                </tr>
              </tbody>
            </table>

            <Hr style={hrStyle} />

            <Text style={paragraphStyle}>
              You can view your registration details and receipt at any time by clicking the button below:
            </Text>

            <Link href={viewUrl} style={buttonStyle}>
              View Receipt
            </Link>

            <Text style={paragraphStyle}>
              If you have any questions about your payment, please contact the event organizer.
            </Text>
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

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginBottom: "20px",
}

const tableLabelStyle = {
  padding: "8px",
  textAlign: "left" as const,
  fontWeight: "bold" as const,
  color: "#555",
  width: "40%",
}

const tableValueStyle = {
  padding: "8px",
  textAlign: "right" as const,
  color: "#333",
}

const totalRowStyle = {
  borderTop: "2px solid #e6ebf1",
  borderBottom: "2px solid #e6ebf1",
  fontWeight: "bold" as const,
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

