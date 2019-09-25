var Exception = (function(error, templateParams) {
    this.error = error;
    this.templateParams = Array.isArray(templateParams) ? templateParams : [templateParams];
});
