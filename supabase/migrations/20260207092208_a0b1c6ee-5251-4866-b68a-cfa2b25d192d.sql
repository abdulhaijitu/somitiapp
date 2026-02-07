
-- Function to calculate yearly contribution summary for a member
CREATE OR REPLACE FUNCTION public.get_member_yearly_summary(
  _member_id uuid,
  _tenant_id uuid,
  _year integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member members;
  _year_start date;
  _year_end date;
  _prev_year_start date;
  _prev_year_end date;
  _monthly_base numeric;
  _total_dues_amount numeric;
  _total_paid_amount numeric;
  _monthly_dues_count integer;
  _fund_raise_total numeric;
  _others_total numeric;
  _carry_forward_unpaid numeric;
  _yearly_cap numeric;
  _remaining_allowance numeric;
  _result jsonb;
BEGIN
  -- Get member
  SELECT * INTO _member FROM members WHERE id = _member_id AND tenant_id = _tenant_id;
  IF _member IS NULL THEN
    RETURN jsonb_build_object('error', 'Member not found');
  END IF;

  -- Define date ranges
  _year_start := make_date(_year, 1, 1);
  _year_end := make_date(_year, 12, 31);
  _prev_year_start := make_date(_year - 1, 1, 1);
  _prev_year_end := make_date(_year - 1, 12, 31);

  -- Get monthly contribution base (from monthly_due_settings or member.monthly_amount)
  SELECT COALESCE(mds.fixed_amount, _member.monthly_amount, 0)
  INTO _monthly_base
  FROM monthly_due_settings mds
  WHERE mds.tenant_id = _tenant_id AND mds.is_enabled = true
  LIMIT 1;

  IF _monthly_base IS NULL THEN
    _monthly_base := COALESCE(_member.monthly_amount, 0);
  END IF;

  -- Count monthly dues generated this year
  SELECT COUNT(*), COALESCE(SUM(d.amount), 0)
  INTO _monthly_dues_count, _total_dues_amount
  FROM dues d
  JOIN contribution_types ct ON d.contribution_type_id = ct.id
  WHERE d.member_id = _member_id
    AND d.tenant_id = _tenant_id
    AND d.due_month >= _year_start
    AND d.due_month <= _year_end
    AND ct.category_type = 'monthly';

  -- Fund raise dues this year
  SELECT COALESCE(SUM(d.amount), 0)
  INTO _fund_raise_total
  FROM dues d
  JOIN contribution_types ct ON d.contribution_type_id = ct.id
  WHERE d.member_id = _member_id
    AND d.tenant_id = _tenant_id
    AND d.due_month >= _year_start
    AND d.due_month <= _year_end
    AND ct.category_type = 'fund_raise';

  -- Others dues this year
  SELECT COALESCE(SUM(d.amount), 0)
  INTO _others_total
  FROM dues d
  JOIN contribution_types ct ON d.contribution_type_id = ct.id
  WHERE d.member_id = _member_id
    AND d.tenant_id = _tenant_id
    AND d.due_month >= _year_start
    AND d.due_month <= _year_end
    AND ct.category_type NOT IN ('monthly', 'fund_raise');

  -- Carry forward: unpaid dues from previous year
  SELECT COALESCE(SUM(d.amount - d.paid_amount), 0)
  INTO _carry_forward_unpaid
  FROM dues d
  WHERE d.member_id = _member_id
    AND d.tenant_id = _tenant_id
    AND d.due_month >= _prev_year_start
    AND d.due_month <= _prev_year_end
    AND d.status IN ('unpaid', 'partial');

  -- Yearly cap = (12 × monthly) + fund_raise + others + carry_forward
  _yearly_cap := (12 * _monthly_base) + _fund_raise_total + _others_total + _carry_forward_unpaid;

  -- Total paid this year (only confirmed payments)
  SELECT COALESCE(SUM(p.amount), 0)
  INTO _total_paid_amount
  FROM payments p
  WHERE p.member_id = _member_id
    AND p.tenant_id = _tenant_id
    AND p.status = 'paid'
    AND p.payment_date >= _year_start::timestamptz
    AND p.payment_date <= (_year_end + interval '1 day')::timestamptz;

  -- Also count payments without payment_date but created in this year
  IF _total_paid_amount = 0 THEN
    SELECT COALESCE(SUM(p.amount), 0)
    INTO _total_paid_amount
    FROM payments p
    WHERE p.member_id = _member_id
      AND p.tenant_id = _tenant_id
      AND p.status = 'paid'
      AND p.created_at >= _year_start::timestamptz
      AND p.created_at <= (_year_end + interval '1 day')::timestamptz;
  END IF;

  -- Total dues amount this year (all categories)
  _total_dues_amount := _total_dues_amount + _fund_raise_total + _others_total;

  _remaining_allowance := GREATEST(0, _yearly_cap - _total_paid_amount);

  _result := jsonb_build_object(
    'member_id', _member_id,
    'year', _year,
    'monthly_base', _monthly_base,
    'monthly_cap', 12 * _monthly_base,
    'monthly_dues_count', _monthly_dues_count,
    'fund_raise_total', _fund_raise_total,
    'others_total', _others_total,
    'carry_forward_unpaid', _carry_forward_unpaid,
    'yearly_cap', _yearly_cap,
    'total_dues_generated', _total_dues_amount + _carry_forward_unpaid,
    'total_paid', _total_paid_amount,
    'outstanding_balance', GREATEST(0, _total_dues_amount + _carry_forward_unpaid - _total_paid_amount),
    'remaining_allowance', _remaining_allowance,
    'cap_usage_percent', CASE WHEN _yearly_cap > 0 THEN ROUND((_total_paid_amount / _yearly_cap) * 100, 1) ELSE 0 END,
    'is_at_limit', _total_paid_amount >= _yearly_cap,
    'is_near_limit', _yearly_cap > 0 AND (_total_paid_amount / _yearly_cap) >= 0.9
  );

  RETURN _result;
END;
$$;
