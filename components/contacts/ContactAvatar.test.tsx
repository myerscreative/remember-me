import { render, screen, fireEvent } from '@testing-library/react';
import { ContactAvatar } from './ContactAvatar';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Camera: () => <div data-testid="camera-icon" />,
  Info: () => <span data-testid="info-icon">i</span>,
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('ContactAvatar', () => {
  const mockContact = {
    id: '123',
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
  };

  const targetDateGreen = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const targetDateAmber = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const targetDateRed = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  it('renders initials when no photo_url is provided', () => {
    render(<ContactAvatar contact={mockContact} daysRemaining={26} cadenceDays={30} targetContactDate={targetDateGreen} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders image when photo_url is provided', () => {
    const contactWithPhoto = { ...mockContact, photo_url: 'https://example.com/photo.jpg' };
    render(<ContactAvatar contact={contactWithPhoto} daysRemaining={26} cadenceDays={30} targetContactDate={targetDateGreen} />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders the correct days remaining', () => {
    render(<ContactAvatar contact={mockContact} daysRemaining={13} cadenceDays={30} targetContactDate={targetDateGreen} />);
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('applies correct color: green >5 days, amber 1-5, red overdue', () => {
    const { rerender } = render(<ContactAvatar contact={mockContact} daysRemaining={10} cadenceDays={30} targetContactDate={targetDateGreen} />);
    let pip = screen.getByText('10');
    expect(pip).toHaveClass('bg-green-500');

    rerender(<ContactAvatar contact={mockContact} daysRemaining={3} cadenceDays={30} targetContactDate={targetDateAmber} />);
    pip = screen.getByText('3');
    expect(pip).toHaveClass('bg-amber-500');

    rerender(<ContactAvatar contact={mockContact} daysRemaining={0} cadenceDays={30} targetContactDate={targetDateRed} />);
    pip = screen.getByText('0');
    expect(pip).toHaveClass('bg-red-500');
  });

  it('calls onAvatarClick when clicking the main avatar area', () => {
    const handleClick = jest.fn();
    render(<ContactAvatar contact={mockContact} daysRemaining={26} cadenceDays={30} targetContactDate={targetDateGreen} onAvatarClick={handleClick} />);

    // Click the avatar container (the one with initials - getByText returns the containing div)
    const avatar = screen.getByText('JD').closest('div[class*="rounded-full"]');
    fireEvent.click(avatar!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('stops propagation when clicking the days remaining pip', () => {
    const handleAvatarClick = jest.fn();
    render(
      <div onClick={handleAvatarClick}>
        <ContactAvatar contact={mockContact} daysRemaining={26} cadenceDays={30} targetContactDate={targetDateGreen} />
      </div>
    );

    const pip = screen.getByText('26');
    fireEvent.click(pip);

    // Parent onClick should NOT be called because of stopPropagation
    expect(handleAvatarClick).not.toHaveBeenCalled();
  });

  it('renders info button for days remaining', () => {
    render(<ContactAvatar contact={mockContact} daysRemaining={26} cadenceDays={30} targetContactDate={targetDateGreen} />);

    const infoButton = screen.getByRole('button', { name: /learn about days remaining/i });
    expect(infoButton).toBeInTheDocument();
  });
});
