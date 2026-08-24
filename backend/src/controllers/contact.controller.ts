import { Request, Response } from 'express';

export const submitContactEnquiry = async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone, monthlyVolume, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!company || !company.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Valid business email is required' });
    }
    if (!phone || !/^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const enquiry = {
      id: `ENQ-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      monthlyVolume: monthlyVolume || '1,000 - 5,000',
      message: message ? message.trim() : '',
      submittedAt: new Date().toISOString()
    };

    console.log('[ContactEnquiryReceived]', enquiry);

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out to LogiFlow! Our sales & logistics team will contact you within 24 hours.',
      enquiryId: enquiry.id
    });
  } catch (error: any) {
    console.error('[ContactEnquiryError]', error);
    return res.status(500).json({ error: 'Failed to process enquiry. Please try again later.' });
  }
};
