const researchPaperValidator = (req, res, next) => {
  const { title, abstract, conclusion } = req.body;

  // console.log('Validating research paper data:', { title, abstract, conclusion });

  if (!title?.trim()) {
    return res.status(400).json({ message: 'Missing required fields: title or sdg_label' });
  }


  next();
};

module.exports = researchPaperValidator;
