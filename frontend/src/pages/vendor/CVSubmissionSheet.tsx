import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { submitCV } from '@/api/submissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2, Paperclip } from 'lucide-react';
import { apiError } from '@/lib/apiError';

const schema = z.object({
  candidate_name: z.string().min(1, 'Candidate name is required'),
  candidate_email: z.string().email('Invalid email').optional().or(z.literal('')),
  availability: z.string().optional(),
  notice_period: z.string().optional(),
  rate_expectation: z.string().optional(),
  submitted_rate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CVSubmissionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jdId: string;
  onSuccess: () => void;
}

export function CVSubmissionSheet({ isOpen, onOpenChange, jdId, onSuccess }: CVSubmissionSheetProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) { setCvFile(null); return; }
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setFileError('Only .pdf, .doc, .docx files are allowed.');
      setCvFile(null);
      return;
    }
    setCvFile(file);
  };

  const onSubmit = async (data: FormValues) => {
    if (!cvFile) { setFileError('Please select a CV file.'); return; }
    setSubmitError(null);
    setIsSubmitting(true);

    const fd = new FormData();
    fd.append('jd_id', jdId);
    fd.append('candidate_name', data.candidate_name);
    if (data.candidate_email) fd.append('candidate_email', data.candidate_email);
    if (data.availability) fd.append('availability', data.availability);
    if (data.notice_period) fd.append('notice_period', data.notice_period);
    if (data.rate_expectation) fd.append('rate_expectation', data.rate_expectation);
    if (data.submitted_rate) fd.append('submitted_rate', data.submitted_rate);
    fd.append('cv_file', cvFile);

    try {
      await submitCV(fd);
      toast({ title: 'CV submitted successfully.' });
      form.reset();
      setCvFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setSubmitError(apiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!isSubmitting) onOpenChange(o); }}>
      <SheetContent className="bg-card border-border w-[480px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Submit a CV</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Candidate Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cv-name">Candidate Name *</Label>
            <Input id="cv-name" {...form.register('candidate_name')} />
            {form.formState.errors.candidate_name && (
              <p className="text-xs text-destructive">{form.formState.errors.candidate_name.message}</p>
            )}
          </div>

          {/* Candidate Email */}
          <div className="space-y-1.5">
            <Label htmlFor="cv-email">Candidate Email</Label>
            <Input id="cv-email" type="email" {...form.register('candidate_email')} />
            {form.formState.errors.candidate_email && (
              <p className="text-xs text-destructive">{form.formState.errors.candidate_email.message}</p>
            )}
          </div>

          {/* Availability */}
          <div className="space-y-1.5">
            <Label htmlFor="cv-avail">Availability</Label>
            <Input id="cv-avail" placeholder="e.g. Immediate, 2 weeks" {...form.register('availability')} />
          </div>

          {/* Notice Period */}
          <div className="space-y-1.5">
            <Label htmlFor="cv-notice">Notice Period</Label>
            <Input id="cv-notice" placeholder="e.g. 30 days" {...form.register('notice_period')} />
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cv-rate-exp">Candidate's Expected Rate</Label>
              <Input id="cv-rate-exp" type="number" {...form.register('rate_expectation')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cv-rate-sub">Submitted Rate</Label>
              <Input id="cv-rate-sub" type="number" {...form.register('submitted_rate')} />
            </div>
          </div>

          {/* CV File */}
          <div className="space-y-1.5">
            <Label htmlFor="cv-file">CV File * <span className="text-muted-foreground text-xs">(.pdf, .doc, .docx)</span></Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="cv-file"
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 cursor-pointer text-sm transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                {cvFile ? cvFile.name : 'Choose file…'}
              </label>
              <input
                id="cv-file"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </div>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {submitError}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
            ) : (
              'Submit CV'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
