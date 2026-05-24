import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import RuleSetAddModal from './RuleSetAddModal.svelte';

vi.mock('$lib/api/client', () => ({
	api: {
		getGeoFiles: vi.fn().mockResolvedValue([]),
		expandGeoTag: vi.fn(),
	},
}));

describe('RuleSetAddModal', () => {
	it('allows editing an existing rule_set tag and submits the new tag', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		render(RuleSetAddModal, {
			props: {
				ruleSet: {
					tag: 'old-set',
					type: 'remote',
					format: 'binary',
					url: 'https://example.com/old.srs',
					update_interval: '24h',
				},
				outboundOptions: [],
				onClose: vi.fn(),
				onSave,
			},
		});

		const tagInput = screen.getByPlaceholderText('geosite-example') as HTMLInputElement;
		expect(tagInput.disabled).toBe(false);

		await fireEvent.input(tagInput, { target: { value: 'new-set' } });
		await fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ tag: 'new-set' }));
	});
});
