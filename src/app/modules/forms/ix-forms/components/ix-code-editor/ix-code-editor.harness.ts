import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { EditorView } from 'codemirror';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxCodeEditorFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxCodeEditorHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-code-editor';

  static with(options: IxCodeEditorFilters): HarnessPredicate<IxCodeEditorHarness> {
    return new HarnessPredicate(IxCodeEditorHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getEditorLines = this.locatorForAll('.cm-line');
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  getInputArea = this.locatorFor('.cm-content');

  async getValue(): Promise<string> {
    return Promise.resolve(this.getEditor().state.doc.toString());
  }

  async setValue(value: string): Promise<void> {
    const inputArea = await this.getInputArea();
    await inputArea.setContenteditableValue?.(value);

    await inputArea.dispatchEvent('input');

    // Using fakeAsync doesn't work for some reason.
    await new Promise((resolve) => {
      setTimeout(resolve);
    });

    await this.forceStabilize();
  }

  isDisabled(): Promise<boolean> {
    return Promise.resolve(this.getEditor().state.readOnly);
  }

  private getEditor(): EditorView {
    const container = document.querySelector<HTMLElement>('.input-container');
    if (!container) {
      throw new Error('Input container not found');
    }

    const editor = EditorView.findFromDOM(container);
    if (!editor) {
      throw new Error('Editor not found');
    }

    return editor;
  }
}
