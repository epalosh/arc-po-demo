# Purchase Order PDF Generation

## Overview

All purchase orders can now be exported as professional PDF documents. The PDFs are formatted according to industry standards and include all necessary information for ordering parts from suppliers.

## PDF Format

### Header Section
- **Company Logo Bar** - Black header with company name (ARC MARINE MANUFACTURING)
- **Document Title** - "PURCHASE ORDER" in large, bold text

### Company & Vendor Information
- **From Section** (Left side)
  - Company name: ARC MARINE MANUFACTURING
  - Address: 1234 Harbor Drive, Seattle, WA 98101
  - Phone: (555) 123-4567
  - Email: orders@arcmarine.com

- **Vendor Section** (Right side)
  - Supplier name
  - Contact person (if available)
  - Address
  - Phone
  - Email

### Order Details
Boxed section containing:
- **PO Number** - Unique identifier (e.g., PO-20260204-0001)
- **Order Date** - When the order is placed
- **Required By** - When parts must be delivered

### Line Items Table
Professional table with columns:
- **Part Number** - Supplier's part number
- **Description** - Part name and description
- **Quantity** - Number of units ordered
- **Unit Price** - Price per unit
- **Total** - Line item total (Quantity × Unit Price)

Styled with:
- Black header with white text
- Alternating row colors (white/light gray)
- Right-aligned numbers for easy reading
- Grid borders for clarity

### Totals Section
- **Subtotal** - Sum of all line items
- **Tax** - Currently 0% (configurable)
- **Total** - Bold, black background with white text for emphasis

### Terms and Conditions
Standard terms including:
- Payment terms (from supplier contract)
- Delivery requirements
- Quality standards
- Pricing agreement
- Partial shipment authorization
- Packing slip requirements

### Footer
On every page:
- Horizontal separator line
- Company contact information
- Page numbers (Page X of Y)
- PO number reference

## How to Use

### Individual PO Export

1. Navigate to **Purchase Orders** page
2. Find the PO you want to export
3. Click the **PDF** button in the Actions column
4. PDF will automatically download to your browser's download folder

**Alternative Method:**
1. Click **View** to open the PO details modal
2. Click **Download PDF** button in the modal footer
3. PDF downloads automatically

### Batch Export (All POs from Generation Run)

1. Navigate to **Generate POs** page
2. Run the PO generation
3. After generation completes, click **Export All PDFs**
4. All POs from that generation run will download sequentially
5. Each PDF downloads with filename format: `PO-{number}.pdf`

## File Naming

PDFs are automatically named using the format:
```
PO-{PO_NUMBER}.pdf
```

Examples:
- `PO-20260204-0001.pdf`
- `PO-20260204-0002.pdf`

## Technical Details

### Implementation
- **Library**: jsPDF with autoTable plugin
- **Format**: Letter size (8.5" × 11")
- **Font**: Helvetica (standard business font)
- **Colors**: Black and white (professional)

### File Size
Typical file sizes:
- Simple PO (1-5 line items): ~20-30 KB
- Medium PO (6-15 line items): ~30-50 KB
- Large PO (15+ line items): ~50-100 KB

### Browser Support
Works in all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Opera

### PDF Features
- ✅ Multi-page support (automatic pagination)
- ✅ Professional formatting
- ✅ Print-ready quality
- ✅ Searchable text
- ✅ Selectable/copyable content
- ✅ Industry-standard layout

## Customization

### Company Information
To update company details, edit the `COMPANY_INFO` constant in:
```
/src/lib/pdf-generator.ts
```

Fields you can customize:
- Company name
- Address
- City/State/ZIP
- Phone number
- Email address

### Terms and Conditions
Default terms are included, but you can:
- Pass custom terms when generating PDFs
- Edit the default terms in `addTermsAndConditions()` method

### Styling
To modify the PDF appearance:
- **Colors**: Update `setFillColor()` and `setDrawColor()` calls
- **Fonts**: Change `setFont()` calls (helvetica, times, courier)
- **Sizes**: Adjust `setFontSize()` values
- **Layout**: Modify positioning coordinates

## Best Practices

### Before Exporting
1. **Verify Supplier Information** - Ensure supplier addresses and contacts are complete
2. **Check Line Items** - Confirm all parts and quantities are correct
3. **Review Totals** - Verify pricing calculations
4. **Add Notes** - Include any special instructions in the notes field

### File Management
1. **Organize by Date** - Create folders for each month's POs
2. **Backup PDFs** - Keep copies for record-keeping
3. **Send to Suppliers** - Email PDFs directly to suppliers
4. **Archive Completed** - Move fulfilled POs to archive folder

### Professional Use
1. **Review Before Sending** - Always review PDF before sending to supplier
2. **Include Cover Email** - Send with professional email explaining order
3. **Request Confirmation** - Ask supplier to confirm receipt and acceptance
4. **Track Status** - Update PO status in system after sending

## Troubleshooting

### PDF Not Downloading
**Problem**: Click PDF button but nothing happens

**Solutions**:
- Check browser's download settings
- Allow pop-ups/downloads from localhost
- Check browser console for errors
- Try different browser

### Missing Information
**Problem**: PDF has blank fields or missing data

**Solutions**:
- Verify supplier has complete information (address, phone, email)
- Check that all parts have descriptions
- Ensure PO has required fields filled

### Formatting Issues
**Problem**: Text overlaps or layout looks wrong

**Solutions**:
- Long supplier addresses may need manual adjustment
- Very long part descriptions may wrap oddly
- Consider shortening descriptions or splitting into multiple lines

### Large Batch Export Fails
**Problem**: Exporting many PDFs stops or hangs

**Solutions**:
- Export in smaller batches (10-15 at a time)
- Check browser memory
- Close other tabs to free up resources
- Wait between generation and export

## Future Enhancements

Potential improvements:
1. **Company Logo** - Add actual logo image to header
2. **Digital Signatures** - Add authorized signature field
3. **QR Codes** - Include QR code linking to online PO tracking
4. **Multi-Currency** - Support for international orders
5. **Language Support** - Generate POs in multiple languages
6. **Email Integration** - Send PDFs directly from app
7. **Cloud Storage** - Auto-upload to Dropbox/Google Drive
8. **Template Selection** - Choose from multiple PO templates

## Support

For PDF-related issues:
- Check browser console for error messages
- Verify supplier data is complete
- Review PDF generator logs
- Test with simple PO first before batch export
