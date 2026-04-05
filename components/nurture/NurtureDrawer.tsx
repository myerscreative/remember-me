"use client";

import { Drawer } from "vaul";
import { MessageCircle, Phone } from "lucide-react";
import { NurtureContext } from "@/types/nurture";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NurtureDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: NurtureContext;
  onAction?: (channel: string) => void;
}

export function NurtureDrawer({ isOpen, onOpenChange, data, onAction }: NurtureDrawerProps) {
  const handleAction = (channel: string) => {
    const phone = data.phoneNumber;

    if (channel === 'Message') {
      if (phone) {
        window.location.href = `sms:${phone.replace(/\D/g, '')}`;
      } else {
        toast.error('No phone number saved');
      }
    } else if (channel === 'Call') {
      if (phone) {
        window.location.href = `tel:${phone.replace(/\D/g, '')}`;
      } else {
        toast.error('No phone number saved');
      }
    }

    onAction?.(channel);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 transition-opacity duration-300 backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
        <Drawer.Content
          className="flex flex-col rounded-t-2xl h-fit mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none"
          style={{
            backgroundColor: "var(--rm-bg-card)",
            borderTop: "0.5px solid var(--rm-border)",
          }}
        >
          <div className="p-6 pb-8 space-y-5 flex-1">
            {/* Handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-2"
              style={{ backgroundColor: "var(--rm-border)" }}
            />

            {/* Header */}
            <header className="text-center">
              <h2
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 19,
                  fontWeight: 400,
                  color: "var(--rm-text-primary)",
                }}
              >
                Say hello to {data.name}
              </h2>
            </header>

            <div className="space-y-4">
              {/* Remember Why */}
              <section
                style={{
                  backgroundColor: "var(--rm-avatar-bg)",
                  border: "0.5px solid var(--rm-border)",
                  borderRadius: 13,
                  padding: "12px 14px",
                }}
              >
                <h3
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--rm-text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Remember why
                </h3>
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: "var(--rm-text-primary)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                  }}
                >
                  &quot;{data.whyStayInContact}&quot;
                </p>
              </section>

              {/* Conversation Starter */}
              {data.lastSharedMemory && (
                <section
                  style={{
                    backgroundColor: "var(--rm-bg-base)",
                    border: "0.5px solid var(--rm-border)",
                    borderRadius: 13,
                    padding: "12px 14px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--rm-text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Conversation starter
                  </h3>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--rm-text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    &quot;Hey! Was just thinking about {data.lastSharedMemory.content}...&quot;
                  </div>
                </section>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handleAction('Message')}
                disabled={!data.phoneNumber}
                className="h-12 flex items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--rm-accent)",
                  color: "#FFFFFF",
                  fontWeight: 500,
                  border: "none",
                }}
              >
                <MessageCircle size={18} />
                Message
              </Button>
              <Button
                onClick={() => handleAction('Call')}
                disabled={!data.phoneNumber}
                variant="outline"
                className="h-12 flex items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--rm-bg-base)",
                  color: "var(--rm-text-primary)",
                  fontWeight: 500,
                  border: "0.5px solid var(--rm-border)",
                }}
              >
                <Phone size={18} style={{ color: "var(--rm-text-secondary)" }} />
                Call
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
