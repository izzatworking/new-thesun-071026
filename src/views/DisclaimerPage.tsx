import StaticPage from '@/components/site/StaticPage'
import useSeo from '@/lib/useSeo'

export default function DisclaimerPage() {
  useSeo({ title: 'Disclaimer', description: 'The Sun Malaysia website disclaimer.' })
  return (
    <StaticPage title="Disclaimer" subtitle="Last Updated: August 26, 2025">
      <p>The Sun Malaysia, operated by Sun Media Corporation Sdn Bhd (“we,” “us,” or “our”), provides the content on thesun.my for general informational purposes only. By using our website, you agree to the terms of this disclaimer.</p>

      <h2>Accuracy of Information</h2>
      <p>While we strive to provide accurate, reliable, and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information contained on thesun.my. Any reliance you place on such information is therefore strictly at your own risk.</p>
      <p><strong>No Professional Advice:</strong> The information on thesun.my, including content related to finance, health, and law, is not intended as a substitute for professional advice. You should not rely on the information provided here as a basis for making any business, legal, or health decisions.</p>

      <h2>Views Expressed (Opinions Section)</h2>
      <p>The opinions expressed in articles and commentary published in our “Opinion” section are those of the individual authors and do not necessarily reflect the official policy or position of The Sun Malaysia or Sun Media Corporation Sdn Bhd. We are not responsible for any views or opinions expressed by our contributors.</p>

      <h2>Content from Corporate News (Spotlight Section)</h2>
      <p>Content published in our “Spotlight” category is sourced from third-party media newswires and partners, including Media Outreach Newswire. While we ensure this content is clearly labelled as sponsored or paid for, the information and views expressed within these articles are the responsibility of the content provider. The Sun Malaysia does not endorse, guarantee, or assume responsibility for the accuracy or claims made in these materials.</p>

      <h2>External Links</h2>
      <p>Thesun.my may contain links to third-party websites or services. These links are provided for your convenience and do not signify that we endorse or are affiliated with these websites. We have no control over and are not responsible for the content, privacy policies, or practices of any third-party websites. You access and use these external sites solely at your own risk.</p>

      <h2>Copyright and Intellectual Property</h2>
      <p>All content published on thesun.my, including articles, images, and videos, is the intellectual property of The Sun Malaysia or its content providers. This content is protected by Malaysian and international copyright and intellectual property laws.</p>
      <p>Unauthorized use, reproduction, or distribution of our content is strictly prohibited. You may not copy, reproduce, or use our content without our express written permission.</p>

      <h2>Limitation of Liability</h2>
      <p>In no event will The Sun Malaysia, its parent company Sun Media Corporation Sdn Bhd, or its employees be liable for any loss or damage, including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from the use of thesun.my.</p>
      <p>We are not liable for any service interruptions, technical issues, or errors that may occur on our website.</p>

      <h2>Changes to the Disclaimer</h2>
      <p>We reserve the right to amend or update this disclaimer at any time without prior notice. The latest version will be posted on this page with the updated date. Your continued use of thesun.my following any changes signifies your acceptance of these revised terms.</p>
    </StaticPage>
  )
}
