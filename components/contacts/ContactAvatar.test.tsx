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

  it('renders initials when no photo_url is provided', () => {
    render(<ContactAvatar contact={mockContact} healthScore={85} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders image when photo_url is provided', () => {
    const contactWithPhoto = { ...mockContact, photo_url: 'https://example.com/photo.jpg' };
    render(<ContactAvatar contact={contactWithPhoto} healthScore={85} />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders the correct health score', () => {
    render(<ContactAvatar contact={mockContact} healthScore={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies correct color based on health score', () => {
    const { rerender } = render(<ContactAvatar contact={mockContact} healthScore={85} />);
    let pip = screen.getByText('85');
    expect(pip).toHaveClass('bg-green-500');

    rerender(<ContactAvatar contact={mockContact} healthScore={55} />);
    pip = screen.getByText('55');
    expect(pip).toHaveClass('bg-orange-500');

    rerender(<ContactAvatar contact={mockContact} healthScore={20} />);
    pip = screen.getByText('20');
    expect(pip).toHaveClass('bg-red-500');
  });

  it('calls onAvatarClick when clicking the main avatar area', () => {
    const handleClick = jest.fn();
    render(<ContactAvatar contact={mockContact} healthScore={85} onAvatarClick={handleClick} />);
    
    // Click the avatar container (the one with initials)
    const avatar = screen.getByText('JD').parentElement;
    fireEvent.click(avatar!);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('stops propagation when clicking the health score pip', () => {
    const handleAvatarClick = jest.fn();
    render(
      <div onClick={handleAvatarClick}>
        <ContactAvatar contact={mockContact} healthScore={85} />
      </div>
    );
    
    const pip = screen.getByText('85');
    fireEvent.click(pip);
    
    // Parent onClick should NOT be called because of stopPropagation
    expect(handleAvatarClick).not.toHaveBeenCalled();
  });

  it('opens popover on pip click', async () => {
    render(<ContactAvatar contact={mockContact} healthScore={85} />);
    
    const pip = screen.getByText('85');
    fireEvent.click(pip);
    
    // Check for popover content
    expect(screen.getByText('Relationship Health Score')).toBeInTheDocument();
    expect(screen.getByText(/represents the current state of your connection with/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
