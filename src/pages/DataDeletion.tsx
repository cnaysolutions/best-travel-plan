import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Best Holiday Plan</p>
                <p className="text-xs text-muted-foreground">Best Holiday Plan</p>
              </div>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">Data Deletion Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 18, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Best Holiday Plan, we respect your right to control your personal data. This Data 
              Deletion Policy explains how you can request the deletion of your personal information 
              from our platform and what happens when you do.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">2. Your Right to Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with applicable data protection laws, including the General Data Protection 
              Regulation (GDPR) and other regional privacy regulations, you have the right to request 
              the deletion of your personal data that we hold. This is also known as the "right to be 
              forgotten."
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">3. What Data Can Be Deleted</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Upon a valid deletion request, we will delete the following data associated with your account:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (name, email address, profile details)</li>
              <li>Travel preferences and saved itineraries</li>
              <li>Trip planning history and search data</li>
              <li>Any saved or favorited destinations</li>
              <li>Communication history with our platform</li>
              <li>Usage analytics tied to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">4. How to Request Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You can request the deletion of your data through any of the following methods:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Email:</strong> Send a request to{" "}
                <a href="mailto:privacy@best-travel-plan.cloud" className="text-primary hover:underline">
                  privacy@best-travel-plan.cloud
                </a>
              </li>
              <li>
                <strong>Account Settings:</strong> Log in to your account and navigate to your profile 
                settings where you can initiate account and data deletion
              </li>
              <li>
                <strong>Contact Form:</strong> Use the contact form on our website to submit a deletion request
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please include your registered email address and any relevant account details to help us 
              locate and process your request efficiently.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">5. Processing Timeline</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will acknowledge your deletion request within 48 hours and process it within 30 days 
              of receiving a verified request. In some cases, we may need to verify your identity before 
              processing the deletion to protect your account security. If additional time is required, 
              we will notify you of the reason and expected completion date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">6. Data We May Retain</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Certain data may be retained even after a deletion request in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Data required to comply with legal obligations (e.g., tax records, transaction logs)</li>
              <li>Data necessary to establish, exercise, or defend legal claims</li>
              <li>Anonymized or aggregated data that can no longer identify you</li>
              <li>Data required for legitimate business interests, such as fraud prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">7. Third-Party Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you signed up or logged in using a third-party service (such as Google), we will delete 
              the data we hold about you. However, you may also need to manage your data directly with 
              the third-party provider. We will make reasonable efforts to notify any third parties with 
              whom we have shared your data about your deletion request.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">8. Consequences of Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Please be aware that deleting your data will result in:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Permanent loss of your account and all associated trip data</li>
              <li>Inability to recover previously saved trips and preferences</li>
              <li>Loss of any remaining credits or subscription benefits</li>
              <li>Removal from our mailing lists and communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This action is irreversible. We recommend exporting any data you wish to keep before 
              submitting a deletion request.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Data Deletion Policy or need assistance with a deletion 
              request, please contact us at{" "}
              <a href="mailto:privacy@best-travel-plan.cloud" className="text-primary hover:underline">
                privacy@best-travel-plan.cloud
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
