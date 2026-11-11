'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BellRing,
  MoonStar,
  Search,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/ToastProvider';

const areaOptions = [
  { value: 'all', label: 'সমস্ত এলাকা' },
  { value: 'shankipara', label: 'শংকিপাড়া' },
  { value: 'charpara', label: 'চরপাড়া' },
  { value: 'agargaon', label: 'আগারগাঁও' },
];

export default function DesignPreviewClient() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">Conversion</p>
            <p className="mt-2 text-2xl font-black text-[var(--ui-text)]">18.4%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">Avg. order</p>
            <p className="mt-2 text-2xl font-black text-[var(--ui-text)]">৳820</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">Response</p>
            <p className="mt-2 text-2xl font-black text-[var(--ui-text)]">2.4m</p>
          </Card>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activity',
      content: (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-5/6 rounded-2xl" />
          <Skeleton className="h-12 w-3/5 rounded-2xl" />
        </div>
      ),
    },
  ];

  return (
    <div data-theme={theme} className="min-h-screen bg-[var(--ui-surface)] text-[var(--ui-text)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-3 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">Preview</p>
              <h1 className="text-lg font-black text-[var(--ui-text)]">Mymensingh Sheba</h1>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            leftIcon={theme === 'light' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
          >
            {theme === 'light' ? 'Dark' : 'Light'} mode
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[var(--ui-text)]">Buttons</h2>
              <Badge variant="available">Ready</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button isLoading>Loading</Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[var(--ui-text)]">Inputs</h2>
              <Badge variant="info">Touch-safe</Badge>
            </div>
            <div className="space-y-3">
              <Input placeholder="Search services" aria-label="Search services" />
              <SearchBar placeholder="Search local services" value="" onChange={() => undefined} />
              <Select options={areaOptions} defaultValue="all" aria-label="Area" />
              <Textarea placeholder="What service do you need?" rows={4} />
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[var(--ui-text)]">Cards</h2>
              <Button variant="ghost" size="sm" leftIcon={<BellRing className="h-4 w-4" />}>
                Alerts
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ServiceCard
                title="Plumber at your doorstep"
                href="/services/plumber"
                image="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
                price="৳750"
                area="শংকিপাড়া"
                rating={4.8}
                ratingCount={120}
              />
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name="Ayesha" size="md" />
                  <div>
                    <p className="font-bold text-[var(--ui-text)]">Ayesha Khatun</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">Verified provider</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="available">Available</Badge>
                  <Badge variant="featured">Top rated</Badge>
                </div>
              </Card>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-black text-[var(--ui-text)]">States</h2>
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setSheetOpen(true)}>
                Open bottom sheet
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() =>
                  toast({ variant: 'success', title: 'Saved', message: 'Your settings were updated.' })
                }
              >
                Trigger toast
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-black text-[var(--ui-text)]">Skeletons</h2>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-black text-[var(--ui-text)]">Tabs</h2>
            <Tabs tabs={tabs} defaultValue="overview" ariaLabel="Preview tabs" />
          </Card>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <EmptyState
            type="search"
            title="No matches found"
            description="Try a broader keyword or a different area to see more local services."
            actionLabel="Reset filters"
            onAction={() => toast({ variant: 'info', title: 'Filters reset', message: 'The search criteria were refreshed.' })}
          />
          <ErrorState
            title="Something went wrong"
            message="We couldn’t load the latest nearby providers. Please try again in a moment."
            onRetry={() => toast({ variant: 'warning', title: 'Retrying', message: 'Refreshing provider data…' })}
          />
        </section>

        <section className="mt-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ui-text-muted)]">Brand</p>
                <h2 className="text-lg font-black text-[var(--ui-text)]">Premium local-service palette</h2>
              </div>
              <Badge variant="verified">Brand scale</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {['brand-50', 'brand-100', 'brand-500', 'brand-700', 'accent-400'].map((swatch) => (
                <div key={swatch} className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
                  <div className="h-16 w-full" style={{ background: `var(--color-${swatch})` }} />
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--ui-text)]">{swatch}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Quick actions"
        subtitle="Local service shortcuts"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => toast({ variant: 'success', title: 'Booked', message: 'Your request was queued.' })}>Confirm</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Button variant="primary" fullWidth leftIcon={<Search className="h-4 w-4" />}>Find a provider</Button>
          <Button variant="secondary" fullWidth leftIcon={<BellRing className="h-4 w-4" />}>View alerts</Button>
          <Button variant="outline" fullWidth leftIcon={<ArrowRight className="h-4 w-4" />}>Track order</Button>
        </div>
      </BottomSheet>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Design preview modal"
        subtitle="Accessible dialog sample"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast({ variant: 'success', title: 'Saved', message: 'The preview demo was accepted.' });
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--ui-text-muted)]">This modal demonstrates the same spacing, focus ring, and interaction pattern used across the app.</p>
          <Input placeholder="Type a quick note" />
          <Textarea placeholder="Share details about the service you need" rows={3} />
        </div>
      </Modal>
    </div>
  );
}
