import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CoinsIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";

import { DeferredPainPointsCarousel } from "@/components/deferred-pain-points-carousel";
import { DeferredTestimonialsSlider } from "@/components/deferred-testimonials-slider";
import { HeroExperiment, resolveHeroVariant } from "@/components/hero-experiment";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  faqLinks,
  featureCards,
  painPoints,
  pricingTiers,
  siteConfig,
  stats,
  testimonials,
} from "@/lib/site-content";

const featureIcons = [BrainCircuitIcon, UsersRoundIcon, WalletCardsIcon];

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-sm dark:bg-white/6">
        <SparklesIcon className="size-3.5" />
        {eyebrow}
      </div>
      <h2 className="section-title text-balance">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
        {body}
      </p>
    </div>
  );
}

function PainPointsFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
      <Card className="border-white/45 bg-white/76 dark:border-white/10 dark:bg-white/6">
        <CardContent className="p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Flake horror stories</div>
          <h3 className="mt-2 font-heading text-3xl leading-none">One no-show becomes six fires</h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Interactive carousel loads after first paint so the landing route can stay lighter.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {painPoints.map((item, index) => (
          <Card
            key={item.title}
            className={`min-h-full border-white/45 bg-white/76 dark:border-white/10 dark:bg-white/6 ${
              index === 0 ? "shadow-[0_36px_90px_-56px_rgba(150,75,95,0.75)] ring-1 ring-primary/30" : "opacity-80"
            }`}
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-primary">{item.label}</div>
              <h4 className="mt-3 font-heading text-3xl leading-none">{item.title}</h4>
              <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{item.story}</p>
              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/6 p-4 text-sm leading-6 dark:bg-white/6">
                {item.impact}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TestimonialsFallback() {
  return (
    <Card className="overflow-hidden border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
      <CardContent className="p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary">
            Testimonials
          </div>
          <h3 className="mt-3 font-heading text-4xl leading-none">Sample praise with real buying language</h3>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Card
              key={item.name}
              className={`border-white/45 bg-white/85 dark:border-white/10 dark:bg-white/8 ${
                index === 0 ? "shadow-[0_32px_90px_-56px_rgba(150,75,95,0.75)] ring-1 ring-primary/30" : "lg:translate-y-3"
              }`}
            >
              <CardContent className="flex h-full flex-col p-5">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                </div>
                <p className="mt-5 flex-1 text-sm leading-7 text-foreground/85">&ldquo;{item.quote}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type HomeProps = {
  searchParams: Promise<{ ab?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const rawVariant = Array.isArray(params.ab) ? params.ab[0] : params.ab;
  const heroVariant = resolveHeroVariant(rawVariant);

  return (
    <div className="pb-16 sm:pb-24">
      <header className="section-shell pt-4 sm:pt-6">
        <div className="glass-panel flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-amber-300 text-white shadow-lg shadow-rose-300/40">
              <HeartHandshakeIcon className="size-5" />
            </div>
            <div>
              <div className="font-heading text-2xl leading-none tracking-wide">
                Wedding Shadow Book
              </div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Vendor rescue platform
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-foreground">
              Pricing
            </a>
            <a href="#stories" className="transition hover:text-foreground">
              Horror Stories
            </a>
            <a href="#testimonials" className="transition hover:text-foreground">
              Testimonials
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Badge className="hidden rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none sm:inline-flex">
              Beta waitlist open
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="space-y-18 sm:space-y-24">
        <HeroExperiment
          demoVideoUrl={siteConfig.demoVideoUrl}
          stripeSignupUrl={siteConfig.stripeSignupUrl}
          variant={heroVariant}
        />

        <section className="section-shell">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="border-white/40 bg-white/70 shadow-[0_20px_70px_-45px_rgba(112,50,64,0.45)] dark:border-white/10 dark:bg-white/7"
              >
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                  <CheckCircle2Icon className="size-5 text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="stories" className="section-shell">
          <SectionIntro
            eyebrow="Pain Points Carousel"
            title="Every planner has a vendor ghost story"
            body="Wedding Shadow Book turns those 11pm panic texts into a single workflow: detect risk, match backups, and lock in a replacement before the aisle walk starts slipping."
          />
          <div className="mt-10">
            <DeferredPainPointsCarousel items={painPoints} fallback={<PainPointsFallback />} />
          </div>
        </section>

        <section id="features" className="section-shell">
          <SectionIntro
            eyebrow="Feature Grid"
            title="AI backup coverage built for chaotic wedding weeks"
            body="The platform scores vendor reliability, surfaces shadow options instantly, and wraps replacements in escrow-safe approvals so your team never swaps one risk for another."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <Card
                  key={feature.title}
                  className="relative overflow-hidden border-white/45 bg-white/72 shadow-[0_30px_80px_-50px_rgba(120,58,75,0.45)] dark:border-white/10 dark:bg-white/6"
                >
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-300 text-primary-foreground shadow-lg shadow-primary/25">
                      <Icon className="size-5" />
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <h3 className="font-heading text-3xl leading-none">
                        {feature.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-foreground dark:border-white/10 dark:bg-white/10"
                      >
                        {feature.highlight}
                      </Badge>
                    </div>
                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="mt-6 rounded-3xl border border-primary/10 bg-primary/6 p-4 dark:bg-white/6">
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Why it matters
                      </div>
                      <p className="mt-2 text-sm leading-6 text-foreground/85">
                        {feature.detail}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden border-white/45 bg-white/72 dark:border-white/10 dark:bg-white/6">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    <CalendarClockIcon className="size-4" />
                    Rescue dashboard
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A live command center with risk scoring, backup response ETAs, and payment status.
                  </p>
                </div>
                <Image
                  src="/dashboard-preview.svg"
                  alt="Dashboard preview showing AI risk scoring and backup vendor status"
                  width={1600}
                  height={1200}
                  className="h-auto w-full"
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/45 bg-white/72 dark:border-white/10 dark:bg-white/6">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    <ShieldCheckIcon className="size-4" />
                    Mobile vendor matching
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Backup confirmations and escrow release approvals stay fast on phones during event day chaos.
                  </p>
                </div>
                <Image
                  src="/mobile-match.svg"
                  alt="Mobile UI preview for instant wedding vendor matching"
                  width={1200}
                  height={1200}
                  className="h-auto w-full"
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="pricing" className="section-shell">
          <SectionIntro
            eyebrow="Pricing"
            title="Start free, then scale your backup bench"
            body="Keep the entry point frictionless for solo planners, then unlock more automations and concierge coverage as your event volume grows."
          />
          <div className="mt-10 grid gap-5 xl:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative overflow-hidden border-white/45 bg-white/75 dark:border-white/10 dark:bg-white/6 ${
                  tier.featured
                    ? "shadow-[0_36px_100px_-45px_rgba(170,113,44,0.65)] ring-1 ring-amber-300/60"
                    : "shadow-[0_30px_90px_-50px_rgba(112,50,64,0.4)]"
                }`}
              >
                <CardContent className="p-6 sm:p-7">
                  {tier.featured ? (
                    <Badge className="rounded-full bg-amber-400/90 px-3 py-1 text-amber-950 shadow-none">
                      Most popular
                    </Badge>
                  ) : null}
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-3xl leading-none">{tier.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-semibold tracking-tight">{tier.price}</p>
                      <p className="text-sm text-muted-foreground">{tier.billing}</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-foreground/85">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-7 h-11 w-full rounded-full text-sm ${
                      tier.featured
                        ? "bg-gradient-to-r from-primary via-rose-500 to-amber-400 text-white shadow-lg shadow-primary/30 hover:opacity-95"
                        : ""
                    }`}
                    variant={tier.featured ? "default" : "outline"}
                  >
                    <a href={siteConfig.stripeSignupUrl}>{tier.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="testimonials" className="section-shell">
          <SectionIntro
            eyebrow="Testimonials Slider"
            title="Social proof that feels like a planner group chat"
            body="These sample testimonials show how the product story lands: fewer disasters, faster backups, and calmer clients."
          />
          <div className="mt-10">
            <DeferredTestimonialsSlider items={testimonials} fallback={<TestimonialsFallback />} />
          </div>
        </section>
      </main>

      <footer className="section-shell mt-18 sm:mt-24">
        <div className="glass-panel overflow-hidden px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
                Event insurance, reimagined
              </Badge>
              <h2 className="mt-5 font-heading text-4xl leading-none sm:text-5xl">
                Backup vendors before panic goes viral.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Wedding Shadow Book helps planners cover talent, decor, transport, and beauty no-shows with AI matching and escrow-safe approvals.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-5">
                  <a href={siteConfig.stripeSignupUrl}>Start Free Trial</a>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <a href="#features">Explore features</a>
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Product
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {faqLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-foreground/85 transition hover:text-primary"
                  >
                    <CoinsIcon className="size-4 text-primary" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Trust
              </div>
              <div className="mt-4 space-y-4 text-sm text-foreground/85">
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="mt-0.5 size-4 text-primary" />
                  <span>Privacy-first event data handling and opt-in vendor outreach.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="mt-0.5 size-4 text-primary" />
                  <span>Escrow release controls keep replacement payments accountable.</span>
                </div>
                <div className="flex items-start gap-3">
                  <UsersRoundIcon className="mt-0.5 size-4 text-primary" />
                  <span>Built for planners, venues, and associate coordinators on event day.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border/70 pt-5 text-sm text-muted-foreground">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Wedding Shadow Book. All rights reserved.</p>
              <div className="flex flex-wrap gap-4">
                <a href="#privacy" className="transition hover:text-foreground">
                  Privacy
                </a>
                <a href="#terms" className="transition hover:text-foreground">
                  Terms
                </a>
                <a href="mailto:founders@weddingshadowbook.com" className="transition hover:text-foreground">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}