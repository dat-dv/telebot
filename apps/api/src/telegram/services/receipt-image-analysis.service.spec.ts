import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOcrText } from './receipt-image-analysis.service';

void test('normalizes Tesseract output before semantic analysis', () => {
  const text = normalizeOcrText('  CỬA HÀNG  A  \r\n\n  Tổng cộng:  65.000 đ  \n');

  assert.equal(text, 'CỬA HÀNG A\nTổng cộng: 65.000 đ');
});
