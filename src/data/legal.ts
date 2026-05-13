// Starter legal templates for Stok. These MUST be reviewed by a lawyer
// licensed in the jurisdiction the app is published from before any public
// release. Replace every [PLACEHOLDER] before submission to the App Store
// or Play Store. The matching markdown files in docs/ are kept in sync by
// hand — update both when these strings change.

export type LegalDocId = 'privacy' | 'terms' | 'disclosure';

export interface LegalSection {
  title?: string;
  text: string;
}

export interface LegalDocument {
  id: LegalDocId;
  title: string;
  shortTitle: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

// Bumping this re-prompts every user to accept again on next launch.
export const ACCEPTANCE_VERSION = 1;

const EFFECTIVE = 'May 13, 2026';

export const PRIVACY: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  shortTitle: 'Privacy',
  effectiveDate: EFFECTIVE,
  intro:
    'Stok ("we", "us") makes this app for tracking your own positions on the Guyana Stock Exchange. This policy explains what data the app handles and where it goes.',
  sections: [
    {
      title: 'What the app stores',
      text:
        'Stok stores the following on your device only: the stocks you watch and the lots you hold, your order activity log, your name, contact details, and broker account numbers as you enter them in Settings, your record of which past dividends you have received, and a local cache of recent GASCI price data. Nothing in this list is sent to us. There are no Stok-operated servers.',
    },
    {
      title: 'Where data is stored',
      text:
        'All app data is stored locally using your device\'s standard secure storage (AsyncStorage on iOS and Android). If you delete the app, the data is deleted with it. Stok has no backup or sync service in this version, so reinstalling the app or switching phones will erase your portfolio and history.',
    },
    {
      title: 'Third-party connections',
      text:
        'When you pull-to-refresh on the Market tab or load older sessions on a Stock Detail screen, the app fetches public web pages from gasci.com. When you tap "Email order" or "Call broker" on the order ticket, the app opens your device\'s mail composer or phone dialer. The content of those messages and calls is delivered by your mail and telephony providers, not by Stok. We have no relationship with GASCI, the Guyana Stock Exchange, or any listed broker; please review their own privacy notices before using their services.',
    },
    {
      title: 'Analytics, crash reporting, and advertising',
      text:
        'This version of Stok includes no third-party analytics, no crash reporting, no advertising SDK, and no telemetry of any kind. If we add any of these in a future version we will update this policy and re-prompt you to accept the changes before the new version starts collecting data.',
    },
    {
      title: 'Accounts',
      text:
        'Stok does not have user accounts, sign-in, or any concept of identity. The "Full name" and contact fields in Settings are used only to fill in the order email or phone call you send to your broker.',
    },
    {
      title: 'Children',
      text:
        'Stok is not directed to children under the age of 16, and we do not knowingly collect data from them.',
    },
    {
      title: 'Changes to this policy',
      text:
        'We may update this policy from time to time. The effective date at the top will change, and any material change will re-prompt you to accept the policy when you next open the app.',
    },
    {
      title: 'Contact',
      text:
        'Questions about this policy can be sent to [CONTACT_EMAIL]. (Replace with the operator\'s real email before publishing.)',
    },
  ],
};

export const TERMS: LegalDocument = {
  id: 'terms',
  title: 'Terms of Use',
  shortTitle: 'Terms',
  effectiveDate: EFFECTIVE,
  intro:
    'By installing or using the Stok app, you agree to these Terms of Use. If you do not agree, do not use the app.',
  sections: [
    {
      title: 'What Stok is, and is not',
      text:
        'Stok is an order-preparation and portfolio-tracking tool for the Guyana Stock Exchange. Stok does not execute trades, hold money, hold securities, or settle transactions. When you submit an order, the app composes an email or phone call to a licensed GSE broker that you select; that broker, not Stok, decides whether to execute the order, at what price, and on what timeline.',
    },
    {
      title: 'No investment advice',
      text:
        'Nothing in Stok is investment advice, a recommendation to buy or sell any security, or a solicitation. Charts, dividend tracking, expected-income figures, yield calculations, and all other information shown in the app are provided for informational purposes only. Consult a licensed financial adviser before making any investment decision.',
    },
    {
      title: 'Accuracy of information',
      text:
        'Stok pulls price data from public GASCI web pages and stores illustrative seed data for dividends until a real declaration feed is wired in. Prices can be stale, parsed incorrectly, or missing entirely; dividend amounts and dates shown in the app are not authoritative. You are solely responsible for verifying any figure against your broker, the issuer, or the GASCI publication before acting on it.',
    },
    {
      title: 'Your broker relationship',
      text:
        'Your relationship with your broker is solely between you and the broker. Stok is not a party to your brokerage agreement and is not responsible for the broker\'s execution, fees, settlement, confirmations, or any other aspect of the trade. You are responsible for confirming receipt of any order you submit through Stok.',
    },
    {
      title: 'License',
      text:
        'We grant you a personal, non-commercial, non-transferable license to install and use the app on devices you own or control. You may not redistribute, sublicense, reverse-engineer, or use the app to provide services to third parties without our written permission.',
    },
    {
      title: 'Warranties disclaimed',
      text:
        'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY OF DATA.',
    },
    {
      title: 'Limitation of liability',
      text:
        'TO THE FULLEST EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR INVESTMENT VALUE, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
    },
    {
      title: 'Changes to these terms',
      text:
        'We may revise these terms from time to time. Material changes will re-prompt you to accept the new terms before you can continue using the app.',
    },
    {
      title: 'Governing law',
      text:
        'These terms are governed by the laws of [JURISDICTION], without regard to its conflict-of-laws principles. (Replace with the operator\'s chosen jurisdiction before publishing.)',
    },
  ],
};

export const DISCLOSURE: LegalDocument = {
  id: 'disclosure',
  title: 'Important Disclosure',
  shortTitle: 'Disclosure',
  effectiveDate: EFFECTIVE,
  intro:
    'Please read this carefully. It explains what Stok is and what it is not, and the risks involved in using it.',
  sections: [
    {
      title: 'Stok is not a registered broker, dealer, or adviser',
      text:
        'Stok is not registered as a broker, dealer, investment adviser, or any other regulated financial intermediary with any securities regulator, including the Guyana Securities Council. Stok is a software tool that helps you prepare orders and track your own portfolio. The execution and settlement of any trade is performed by a licensed GSE broker, not by Stok.',
    },
    {
      title: 'No personalized recommendations',
      text:
        'Stok does not provide personalized investment recommendations, financial planning, suitability analysis, or any form of tailored advice. The companies shown on the Market tab are simply those listed on the Guyana Stock Exchange; their inclusion is not an endorsement. Stock-detail screens, charts, yield figures, and dividend projections are informational only.',
    },
    {
      title: 'Independence',
      text:
        'Stok is not affiliated with, endorsed by, or sponsored by the Guyana Stock Exchange, GASCI, the Guyana Securities Council, any listed issuer, or any licensed broker referenced in the app.',
    },
    {
      title: 'Data quality',
      text:
        'Price data is scraped from publicly available GASCI pages and may be delayed, missing, or parsed incorrectly. Dividend declarations shown in the Dividends tab are illustrative seed data; until a real feed is integrated, those amounts and dates may not match what your broker or the issuer reports. Always verify any figure against an authoritative source before acting on it.',
    },
    {
      title: 'Risk of loss',
      text:
        'All investing in securities involves risk, including loss of principal. The value of securities can go down as well as up. The Guyana Stock Exchange trades infrequently, often with limited liquidity, which can amplify price movements and make exits slow or expensive. Past performance is not indicative of future results.',
    },
    {
      title: 'Consult a licensed adviser',
      text:
        'Before making any investment decision you should consult a licensed financial adviser who is familiar with your circumstances and the Guyanese securities market.',
    },
  ],
};

export const ALL_LEGAL: Record<LegalDocId, LegalDocument> = {
  privacy: PRIVACY,
  terms: TERMS,
  disclosure: DISCLOSURE,
};
