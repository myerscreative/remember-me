import ContactPorter from '@/components/contacts/ContactPorter';

export const metadata = {
  title: 'Contact Porter | ReMember Me',
  description: 'Upload and plant seeds from your iPhone contacts.',
};

export default function PorterPage() {
  return (
    <div className="container mx-auto py-8">
      <ContactPorter />
    </div>
  );
}
