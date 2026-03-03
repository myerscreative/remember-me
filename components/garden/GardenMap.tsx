import { Seedling } from './Seedling';
import { ContactStatus } from '@/hooks/useGardenPhysics';

interface Contact {
  id: string;
  name: string;
  status: ContactStatus;
}

export const GardenMap = ({ contacts }: { contacts: Contact[] }) => {
  return (
    <div className="relative w-full h-[600px] bg-slate-950 overflow-hidden flex items-center justify-center rounded-3xl border border-slate-900">
      {/* Background Rings */}
      <div className="absolute h-[160px] w-[160px] border border-slate-900/50 rounded-full" />
      <div className="absolute h-[360px] w-[360px] border border-slate-900/50 rounded-full" />
      <div className="absolute h-[560px] w-[560px] border border-slate-900/50 rounded-full" />
      
      {/* The People */}
      {contacts.map((contact, i) => (
        <Seedling 
          key={contact.id} 
          id={contact.id}
          index={i} 
          name={contact.name} 
          status={contact.status} 
        />
      ))}
    </div>
  );
};
