"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export interface ComplianceFormData {
  rulesCompliance: "Yes" | "No" | "N/A";
  falseClaimsFree: "Yes" | "No" | "N/A";
  claimsSubstantiated: "Yes" | "No" | "N/A";
  offensiveContentFree: "Yes" | "No" | "N/A";
  targetAudienceAppropriate: "Yes" | "No" | "N/A";
  comparativeAdvertisingFair: "Yes" | "No" | "N/A";
  disclaimersDisplayed: "Yes" | "No" | "N/A";
  unapprovedEndorsementsAbsent: "Yes" | "No" | "N/A";
  statutoryApprovalsAttached: "Yes" | "No" | "N/A";
  sanctionHistoryReviewed: "Yes" | "No" | "N/A";
  culturalReferencesAppropriate: "Yes" | "No" | "N/A";
  childrenProtected: "Yes" | "No" | "N/A";
  sanctionsHistory: "Yes" | "No" | "N/A";
  overallComplianceNotes?: string;
}

interface ComplianceQuestion {
  id: keyof ComplianceFormData;
  label: string;
  isNote?: boolean;
}

const complianceQuestions: ComplianceQuestion[] = [
  { id: "rulesCompliance", label: "Does the advertisement comply with our rules?" },
  { id: "falseClaimsFree", label: "Is the advertisement free from false or misleading claims?" },
  { id: "claimsSubstantiated", label: "Are all claims substantiated with evidence?" },
  { id: "offensiveContentFree", label: "Does the advertisement avoid offensive, indecent, obscene or discriminatory content?" },
  { id: "targetAudienceAppropriate", label: "Is the target audience appropriate for the content?" },
  { id: "comparativeAdvertisingFair", label: "Is comparative advertising fair, honest, and not disparaging?" },
  { id: "disclaimersDisplayed", label: "Are mandatory disclaimers or risk warnings properly displayed (where applicable)?" },
  { id: "unapprovedEndorsementsAbsent", label: "Does the Ad include unapproved testimonials or endorsements?" },
  { id: "statutoryApprovalsAttached", label: "Are statutory approvals from relevant sector regulators attached?" },
  { id: "sanctionHistoryReviewed", label: "Have we reviewed the sanction history of the  advertiser or agency?" },
  { id: "culturalReferencesAppropriate", label: "Is the use of language, symbols, national emblems or cultural references appropriate and respectful?" },
  { id: "childrenProtected", label: "Are children appropriately protected (if children are part of the target audience)?" },
  { id: "sanctionsHistory", label: "Does the Advertiser or Agency have a sanctions history?" },
  { id: "overallComplianceNotes", label: "Overall Compliance Notes (Optional)", isNote: true },
];

interface ComplianceFormProps {
  onSubmit: (data: ComplianceFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<ComplianceFormData>; // For viewing/editing existing data
  isReadOnly?: boolean; // To make the form view-only
}

const ComplianceForm: React.FC<ComplianceFormProps> = ({ onSubmit, isSubmitting, initialData, isReadOnly }) => {
  const [formData, setFormData] = useState<Partial<ComplianceFormData>>(initialData || {});
  const [isFormComplete, setIsFormComplete] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Check if all non-note questions have a selection
    const allQuestionsAnswered = complianceQuestions
      .filter(q => !q.isNote)
      .every(q => !!formData[q.id as keyof Omit<ComplianceFormData, 'overallComplianceNotes'>]);
    setIsFormComplete(allQuestionsAnswered);
  }, [formData]);

  const handleChange = (id: keyof ComplianceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete || isReadOnly) { // Allow submission if read-only (though button might be hidden)
      onSubmit(formData as ComplianceFormData);
    } else {
      // Optionally, show a message to complete the form
      console.warn("Please complete all compliance questions.");
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Compliance Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {complianceQuestions.map(question => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id}>{question.label}</Label>
              {question.isNote ? (
                <Textarea
                  id={question.id}
                  value={formData[question.id] || ""}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  placeholder="Enter any additional notes..."
                  disabled={isReadOnly || isSubmitting}
                  rows={3}
                />
              ) : (
                <RadioGroup
                  id={question.id}
                  value={formData[question.id as keyof Omit<ComplianceFormData, 'overallComplianceNotes'>]}
                  onValueChange={(value) => handleChange(question.id, value)}
                  className="flex space-x-4"
                  disabled={isReadOnly || isSubmitting}
                >
                  {(["Yes", "No", "N/A"] as const).map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} disabled={isReadOnly || isSubmitting} />
                      <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}
          {!isReadOnly && (
            <CardFooter className="px-0 pt-6">
              <Button type="submit" disabled={!isFormComplete || isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Compliance Form"}
              </Button>
            </CardFooter>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplianceForm;
