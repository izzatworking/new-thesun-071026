import { useState } from 'react'
import StaticPage from '@/components/site/StaticPage'
import useSeo from '@/lib/useSeo'
import aboutBuilding from '@/assets/about-building.png'
import theSunLogo from '@/assets/thesun-logo.png'

const STATS = [
  { value: '500k+', label: 'Active Subscribers' },
  { value: '800k+', label: 'Article Published' },
  { value: '300k+', label: 'Yearly Print Copies' },
  { value: '50k+', label: 'Monthly iPaper Readers' },
]

const MISSION_ITEMS = [
  {
    title: 'Quality Journalism for the Digital Age',
    body: 'At The Sun Malaysia, our mission is to empower our readers with accurate and timely information. Our editorial approach is driven by a deep commitment to integrity, authority, and impartiality.',
  },
  {
    title: 'Integrity',
    body: 'We adhere to the highest standards of journalism, striving for accuracy and transparency in all our reporting. Our readers’ trust is our greatest asset.',
  },
  {
    title: 'Authority',
    body: 'As a long-standing national newspaper, our expertise covers a wide range of topics, including national and international affairs, business, sports, and lifestyle. Our experienced editorial team ensures in-depth and authoritative coverage.',
  },
  {
    title: 'Relevance',
    body: 'We focus on the news that matters most to urban and educated Malaysians. Our content is crafted to be engaging and easily digestible, catering to the fast-paced lifestyle of our audience.',
  },
  {
    title: 'Accessibility',
    body: 'By providing our content for free, both in print and online, we ensure that quality news is accessible to all Malaysians.',
  },
]

function MissionAccordion() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="bg-primary rounded-xl px-6 sm:px-10 py-2 sm:py-4">
      {MISSION_ITEMS.map((item, i) => {
        const isOpen = openIndex === i
        const isLast = i === MISSION_ITEMS.length - 1
        return (
          <div key={item.title} className={!isLast ? 'border-b border-white/30' : ''}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-4 py-5 sm:py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg
                  className={`w-4 h-4 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-white text-xl sm:text-2xl font-serif-headline">{item.title}</span>
            </button>
            {isOpen && (
              <p className="text-white/90 pb-6 sm:pb-8 pl-12 sm:pl-14 pr-2 -mt-2 leading-relaxed">
                {item.body}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AboutPage() {
  useSeo({ title: 'About Us', description: 'About The Sun Malaysia.' })

  return (
    <StaticPage title="About Us">
      <p>
        <strong>The Sun Malaysia</strong> — Malaysia’s national English-language daily newspaper, established on 1 June 1993.
      </p>

      {/* Stat badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-primary text-primary-foreground rounded-full flex flex-col items-center justify-center text-center px-4 py-6"
          >
            <span className="text-2xl sm:text-3xl font-extrabold leading-none">{stat.value}</span>
            <span className="text-xs sm:text-sm font-semibold mt-2">{stat.label}</span>
          </div>
        ))}
      </div>

      <p>Since our launch in 1993, we have been a cornerstone of Malaysian journalism, providing millions of readers with reliable, balanced, and concise news. On April 8, 2002, we solidified our place as Malaysia’s first national free daily, making quality journalism accessible to everyone.</p>
      <p>Our website, <strong>thesun.my</strong>, is the digital extension of this commitment, delivering real-time news and analysis to a diverse online audience across Malaysia and the world.</p>

      {/* Story section */}
      <h2>The Story</h2>
      <div className="flex flex-col md:flex-row gap-8 items-center my-6">
        <div className="flex-1">
          <p><strong>Legacy of Excellence in Malaysian Media.</strong> The Sun Malaysia’s journey is one of continuous growth and adaptation. Starting as a paid newspaper, we re-emerged in 2002 with a groundbreaking free distribution model, which transformed the local media landscape. Over the years, our dedication to public service journalism and insightful opinion writing has been recognized with multiple awards from the Society of Publishers in Asia (SOPA).</p>
        </div>
        <div className="flex-shrink-0 w-full md:w-72">
          <img src={aboutBuilding.src} alt="The Sun Malaysia head office" className="w-full h-auto" />
        </div>
      </div>
      <p>Today, thesun.my continues this legacy, using digital platforms to deliver breaking news and thought-provoking stories instantly. Our online presence, powered by our trusted reputation, makes us a go-to source for anyone seeking reliable Malaysian news.</p>

      {/* Mission and Values */}
      <h2>Mission and Values</h2>
      <MissionAccordion />

      {/* Connect */}
      <h2>Connect With Us</h2>
      <p>Your feedback is invaluable. Stay connected with the latest news and stories by following us on social media and exploring the various sections of our website.</p>

      {/* Head office */}
      <h2>Head Office</h2>
      <div className="flex flex-col md:flex-row gap-8 items-center my-6">
        <div className="flex-1">
          <p>
            <strong>Sun Media Corporation Sdn Bhd</strong><br />
            Level 4, Lot 6, Jalan 51/217,<br />
            46050 Petaling Jaya,<br />
            Selangor Darul Ehsan,
          </p>
          <p>Visit our <a href="/contact">Contact Us</a> page for specific department emails.</p>
        </div>
        <div className="flex-shrink-0 w-full md:w-64">
          <img src={theSunLogo.src} alt="The Sun Malaysia logo" className="w-full h-auto" />
        </div>
      </div>
    </StaticPage>
  )
}
