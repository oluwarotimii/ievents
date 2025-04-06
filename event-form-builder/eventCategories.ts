import type { FormField, PaymentField } from "./types"

export interface EventCategory {
  name: string
  defaultFields: FormField[]
}

export const eventCategories: EventCategory[] = [
  {
    name: "Social & Personal Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      {
        id: "3",
        type: "select",
        label: "RSVP Status",
        required: true,
        options: ["Attending", "Not Attending", "Maybe"],
      },
      { id: "4", type: "textarea", label: "Dietary Preferences", required: false },
      { id: "5", type: "payment", label: "Event Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Corporate & Professional Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "text", label: "Company", required: true },
      { id: "4", type: "text", label: "Job Title", required: false },
      {
        id: "5",
        type: "select",
        label: "Session Preference",
        required: false,
        options: ["Session A", "Session B", "Session C"],
      },
      { id: "6", type: "payment", label: "Registration Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Cultural & Community Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "phone", label: "Phone Number", required: false },
      {
        id: "4",
        type: "select",
        label: "Ticket Type",
        required: true,
        options: ["General Admission", "VIP", "Student"],
      },
      { id: "5", type: "payment", label: "Ticket Price", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Sports & Fitness Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "date", label: "Date of Birth", required: true },
      { id: "4", type: "select", label: "T-Shirt Size", required: false, options: ["S", "M", "L", "XL", "XXL"] },
      { id: "5", type: "textarea", label: "Medical Information", required: false },
      { id: "6", type: "payment", label: "Registration Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Educational & Training Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "text", label: "Institution/Organization", required: false },
      {
        id: "4",
        type: "select",
        label: "Session Preference",
        required: false,
        options: ["Beginner", "Intermediate", "Advanced"],
      },
      { id: "5", type: "payment", label: "Course Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Charity & Fundraising Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "phone", label: "Phone Number", required: false },
      {
        id: "4",
        type: "select",
        label: "Donation Amount",
        required: false,
        options: ["$10", "$25", "$50", "$100", "Other"],
      },
      { id: "5", type: "payment", label: "Custom Donation Amount", required: false, currency: "USD" } as PaymentField,
      { id: "6", type: "radio", label: "Volunteer?", required: false, options: ["Yes", "No"] },
    ],
  },
  {
    name: "Virtual & Hybrid Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "select", label: "Attendance Mode", required: true, options: ["Virtual", "In-Person"] },
      {
        id: "4",
        type: "select",
        label: "Preferred Platform",
        required: false,
        options: ["Zoom", "Microsoft Teams", "Google Meet"],
      },
      { id: "5", type: "payment", label: "Registration Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Seasonal & Holiday Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "phone", label: "Phone Number", required: false },
      { id: "4", type: "select", label: "Number of Guests", required: true, options: ["1", "2", "3", "4", "5+"] },
      { id: "5", type: "textarea", label: "Special Requests", required: false },
      { id: "6", type: "payment", label: "Event Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Technology & Innovation Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "text", label: "Company/Organization", required: false },
      {
        id: "4",
        type: "select",
        label: "Area of Interest",
        required: true,
        options: ["AI/ML", "Blockchain", "IoT", "Cybersecurity", "Other"],
      },
      { id: "5", type: "textarea", label: "What do you hope to learn?", required: false },
      { id: "6", type: "payment", label: "Registration Fee", required: true, currency: "USD" } as PaymentField,
    ],
  },
  {
    name: "Travel & Tourism Events",
    defaultFields: [
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email", required: true },
      { id: "3", type: "phone", label: "Phone Number", required: true },
      {
        id: "4",
        type: "select",
        label: "Preferred Destination",
        required: false,
        options: ["Europe", "Asia", "Africa", "North America", "South America", "Australia"],
      },
      { id: "payment", label: "Booking Fee", required: true, currency: "USD" } as PaymentField,
      { id: "5", type: "textarea", label: "Special Requirements", required: false },
    ],
  },
]

