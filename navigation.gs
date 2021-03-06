const CARD_SETTINGS = 'Project settings',
      CARD_GENERATE = 'Generate sheet',
      CARD_IMPORT = 'Import',
      CARD_INSERT = 'Rich text macros';
const KEY_DOUPDATE = 'doupdate_key',
      KEY_DOPRELOAD = 'dopreload_key',
      KEY_INLINEITEM_IDENTIFIERTYPE = 'inlineitem_identifiertype_key',
      KEY_INLINEITEM_IDENTIFIER = 'inlineitem_identifier_key',
      KEY_ITEMLINK_IDENTIFIER = 'itemlink_identifier_key',
      KEY_ITEMLINK_IDENTIFIERTYPE = 'itemlink_identifiertype_key',
      KEY_ITEMLINK_TEXT = 'itemlink_text_key',
      KEY_ASSETLINK_IDENTIFIER = 'assetlink_identifier_key',
      KEY_ASSETLINK_IDENTIFIERTYPE = 'assetlink_identifiertype_key',
      KEY_ASSETLINK_TEXT = 'assetlink_text_key';
const VALUE_IDENTIFIERTYPE_ID = 'id',
      VALUE_IDENTIFIERTYPE_EXTERNAL = 'external_id';

const showHomeCard = () => {
  // Nav buttons
  const settingsButton = CardService.newTextButton()
      .setText(CARD_SETTINGS)
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('navigateTo')
        .setParameters({ 'card': CARD_SETTINGS }));
  const generateButton = CardService.newTextButton()
      .setText(CARD_GENERATE)
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('navigateTo')
        .setParameters({ 'card': CARD_GENERATE }));
  const importButton = CardService.newTextButton()
      .setText(CARD_IMPORT)
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('navigateTo')
        .setParameters({ 'card': CARD_IMPORT }));
  const insertButton = CardService.newTextButton()
      .setText(CARD_INSERT)
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('navigateTo')
        .setParameters({ 'card': CARD_INSERT }));

  // Get connected project
  const keys = loadKeys();
  let projectInfo;
  if(keys.pid) {
    let response = getProjectInfo(keys.pid);
    if(response.code === 200) {
      projectInfo = CardService.newDecoratedText()
        .setTopLabel('Connected to project')
        .setText(`<b>${response.data.name}</b>`)
        .setBottomLabel(`Environment ${response.data.environment}`);
    }
    else {
      projectInfo = CardService.newTextParagraph()
        .setText(`Cannot connect to project: "${response.data}"`);
    }
  }
  else {
    projectInfo = CardService.newTextParagraph()
      .setText('You are not connected to a project. Please visit the <b>Project settings</b> menu to set your API keys. If you recently updated your keys, please refresh the addon from the sidebar header.');
  }
  
  // Help button
  const fixedFooter = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Help")
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openUrl')
        .setParameters({ 'url': 'https://github.com/Kentico/kontent-google-sheets-add-on#usage' })));

  const homeCard = CardService.newCardBuilder()
    .addSection(CardService.newCardSection()
      .addWidget(projectInfo)
      .addWidget(importButton)
      .addWidget(insertButton)
      .addWidget(generateButton)
      .addWidget(settingsButton))
    .setFixedFooter(fixedFooter)
    .build();
    
  return [homeCard];
}

const showImportProgress = (rowNum, totalRows) => {
  const card = CardService.newCardBuilder()
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Import partially completed:'))
      .addWidget(CardService.newTextParagraph().setText(`<b>${rowNum}/${totalRows}</b>`))
      .addWidget(CardService.newTextParagraph().setText('Please click the button below to resume importing the Sheet.')))
    .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
        .setText('Resume')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('upsertChunk'))))
    .build();
  const nav = CardService.newNavigation().pushCard(card);

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

const navigateTo = (e = undefined) => {
  let nav;
  const cardName = e ?  e.parameters.card : '';
  switch(cardName) {
    case CARD_GENERATE:
      nav = CardService.newNavigation().pushCard(makeGenerateCard());
      break;
    case CARD_IMPORT:
      nav = CardService.newNavigation().pushCard(makeImportCard());
      break;
    case CARD_SETTINGS:
      nav = CardService.newNavigation().pushCard(makeSettingsCard());
      break;
    case CARD_INSERT:
      nav = CardService.newNavigation().pushCard(makeInsertCard());
      break;
    default:
      nav = CardService.newNavigation().popToRoot();
  }

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

const makeInsertCard = () => {
  // Insert item link
  const itemLinkSection = CardService.newCardSection()
    .setHeader('Insert content item link');
  const itemLinkType = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle('Identifier type')
    .setFieldName(KEY_ITEMLINK_IDENTIFIERTYPE)
    .addItem('Item ID', VALUE_IDENTIFIERTYPE_ID, true)
    .addItem('External ID', VALUE_IDENTIFIERTYPE_EXTERNAL, false);
  const itemLinkIDInput = CardService.newTextInput()
    .setFieldName(KEY_ITEMLINK_IDENTIFIER)
    .setHint('Enter the content item ID or external ID');
  const itemLinkTextInput = CardService.newTextInput()
    .setFieldName(KEY_ITEMLINK_TEXT)
    .setHint('Link text');
  const itemLinkButton = CardService.newTextButton()
    .setText('Insert')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('insertMacro')
      .setParameters({ macro: KEY_ITEMLINK_IDENTIFIER }));
  itemLinkSection.addWidget(itemLinkType);
  itemLinkSection.addWidget(itemLinkIDInput);
  itemLinkSection.addWidget(itemLinkTextInput);
  itemLinkSection.addWidget(itemLinkButton);

  // Insert inline item
  const inlineItemSection = CardService.newCardSection()
    .setHeader('Insert inline content item');
  const inlineItemType = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle('Identifier type')
    .setFieldName(KEY_INLINEITEM_IDENTIFIERTYPE)
    .addItem('Item ID', VALUE_IDENTIFIERTYPE_ID, true)
    .addItem('External ID', VALUE_IDENTIFIERTYPE_EXTERNAL, false);
  const inlineItemInput = CardService.newTextInput()
    .setFieldName(KEY_INLINEITEM_IDENTIFIER)
    .setHint('Enter the content item ID or external ID');
  const inlineItemButton = CardService.newTextButton()
    .setText('Insert')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('insertMacro')
      .setParameters({ macro: KEY_INLINEITEM_IDENTIFIER }));
  inlineItemSection.addWidget(inlineItemType);
  inlineItemSection.addWidget(inlineItemInput);
  inlineItemSection.addWidget(inlineItemButton);

  // Insert asset link
  const assetLinkSection = CardService.newCardSection()
    .setHeader('Insert asset link');
  const assetLinkType = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle('Identifier type')
    .setFieldName(KEY_ASSETLINK_IDENTIFIERTYPE)
    .addItem('Asset ID', VALUE_IDENTIFIERTYPE_ID, true)
    .addItem('External ID', VALUE_IDENTIFIERTYPE_EXTERNAL, false);
  const assetLinkInput = CardService.newTextInput()
    .setFieldName(KEY_ASSETLINK_IDENTIFIER)
    .setHint('Enter the asset ID or external ID');
  const assetLinkTextInput = CardService.newTextInput()
    .setFieldName(KEY_ASSETLINK_TEXT)
    .setHint('Link text');
  const assetLinkButton = CardService.newTextButton()
    .setText('Insert')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('insertMacro')
      .setParameters({ macro: KEY_ASSETLINK_IDENTIFIER }));
  assetLinkSection.addWidget(assetLinkType);
  assetLinkSection.addWidget(assetLinkInput);
  assetLinkSection.addWidget(assetLinkTextInput);
  assetLinkSection.addWidget(assetLinkButton);

  return CardService.newCardBuilder()
    .setName(CARD_INSERT)
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('To insert a macro, the cell must be selected but <b>not</b> in edit mode (the cursor should not be visible).')))
    .addSection(itemLinkSection)
    .addSection(inlineItemSection)
    .addSection(assetLinkSection)
    .build();
}

const makeGenerateCard = () => {
  const section = CardService.newCardSection();
  const response = loadTypes();

  if(response.code === 200) {
    response.data.forEach(type => {
      section.addWidget(
        CardService.newTextButton().setText(type.name)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('makeSheet')
          .setParameters({ 'json': JSON.stringify(type) })));
    });
  }
  else {
    section.addWidget(CardService.newTextParagraph().setText(response.data));
  }

  const fixedFooter = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
            .setText("Help")
            .setOnClickAction(CardService.newAction()
              .setFunctionName('openUrl')
              .setParameters({ 'url': 'https://github.com/Kentico/kontent-google-sheets-add-on#preparing-the-sheet' })));

  return CardService.newCardBuilder()
    .setName(CARD_GENERATE)
    .setHeader(CardService.newCardHeader()
      .setTitle('Generate a new Sheet from a content type with the required headers.'))
    .addSection(section)
    .setFixedFooter(fixedFooter)
    .build();
}

const openUrl = (e) => {
  const url = e.parameters.url;
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink().setUrl(url).setOpenAs(CardService.OpenAs.OVERLAY))
    .build(); 
}

const makeImportCard = () => {
  var updateSwitch = CardService.newKeyValue()
    .setTopLabel("Update existing items")
    .setContent("If enabled, existing content items will be updated. If disabled, new items will always be created")
    .setMultiline(true)
    .setSwitch(CardService.newSwitch()
      .setSelected(true)
      .setFieldName(KEY_DOUPDATE)
      .setValue('true'));
  var preloadSwitch = CardService.newKeyValue()
    .setTopLabel("Preload content items")
    .setContent("If enabled, all content items will be cached at the start of the import. Depending on the size of the project, this can greatly improve performance and reduce the number of API calls.")
    .setMultiline(true)
    .setSwitch(CardService.newSwitch()
      .setSelected(true)
      .setFieldName(KEY_DOPRELOAD)
      .setValue('true'));

  const section = CardService.newCardSection()
    .addWidget(updateSwitch)
    .addWidget(preloadSwitch);

  const fixedFooter = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText("Run")
      .setOnClickAction(CardService.newAction().setFunctionName('doImport')));

  return CardService.newCardBuilder()
    .setName(CARD_IMPORT)
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('Imports the currently active Sheet. Rows in the Sheet are imported as content items of the type specified by the Sheet name.')))
    .addSection(section)
    .setFixedFooter(fixedFooter)
    .build();
}

const makeSettingsCard = () => {
  const keys = loadKeys();

  const fixedFooter = CardService.newFixedFooter()
    .setSecondaryButton(CardService.newTextButton()
            .setText("Clear")
            .setOnClickAction(CardService.newAction().setFunctionName('clearSettings')))
    .setPrimaryButton(CardService.newTextButton()
            .setText("Save")
            .setOnClickAction(CardService.newAction().setFunctionName('saveSettings')));

  const section = CardService.newCardSection()
    .addWidget(CardService.newTextInput()
      .setFieldName("pid")
      .setValue(keys.pid ? keys.pid : "")
      .setTitle("Project ID"))
    .addWidget(CardService.newTextInput()
      .setFieldName("cmkey")
      .setValue(keys.cmkey ? keys.cmkey : "")
      .setTitle("Management API key"))
    .addWidget(CardService.newTextInput()
      .setFieldName("previewkey")
      .setValue(keys.previewkey ? keys.previewkey : "")
      .setTitle("Preview API key"));

  return CardService.newCardBuilder()
    .setName(CARD_SETTINGS)
    .setHeader(CardService.newCardHeader().setTitle(CARD_SETTINGS))
    .addSection(section)
    .setFixedFooter(fixedFooter)
    .build();
}

const clearSettings = (e) => {
  PropertiesService.getUserProperties().deleteAllProperties();
  return CardService.newActionResponseBuilder()
    .setStateChanged(true)
    .setNavigation(CardService.newNavigation().popCard())
    .build(); 
}

const saveSettings = (e) => {
  const keys = e.commonEventObject.formInputs;
  PropertiesService.getUserProperties().setProperties({
    'pid': keys.pid.stringInputs.value[0],
    'cmkey': keys.cmkey.stringInputs.value[0],
    'previewkey': keys.previewkey.stringInputs.value[0]
  });

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().popCard())
    .setStateChanged(true)
    .setNotification(CardService.newNotification().setText("Keys saved"))
    .build();
}